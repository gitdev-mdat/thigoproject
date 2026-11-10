import { useCallback, useEffect, useRef, useState } from "react";
import {
  AuthError,
  type AuthUser,
  type QuickLoginAccount,
  type QuickLoginOffer
} from "@thigo/auth-client";

import {
  APP_ROLE,
  OTP_RESEND_SECONDS,
  authClient,
  authErrorMessage,
  sessionStore
} from "../services/auth";
import { isLikelyVietnamesePhone } from "../utils/phone";

export type AuthStep =
  | "restoring"
  | "restoreFailed"
  | "phone"
  | "otp"
  | "authenticated"
  /** Signed in, but not (yet) a merchant: the partner application flow. */
  | "applicant";

/**
 * The Merchant app signs every phone in as a possible applicant. The session
 * proves the phone only; the server's MERCHANT check decides which screen opens.
 */
const SIGN_IN = "MERCHANT_APPLICANT" as const;

export function useAuthSession() {
  const [step, setStep] = useState<AuthStep>("restoring");
  const [phone, setPhone] = useState("");
  const [otp, setOtpValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState<AuthUser>();
  const [cooldown, setCooldown] = useState(0);
  const verifying = useRef(false);
  // Offered by the API only in local development with fixtures on.
  const [quickLogin, setQuickLogin] = useState<QuickLoginOffer | null>(null);

  useEffect(() => {
    void authClient.getQuickLoginOffer(APP_ROLE).then(setQuickLogin);
  }, []);

  /** Opens the store for a merchant, the application flow for anyone else. */
  const enter = useCallback(async (token: string, current: AuthUser) => {
    setUser(current);
    try {
      await authClient.checkAccess(APP_ROLE, token);
      setStep("authenticated");
    } catch (e) {
      if (e instanceof AuthError && e.code === "forbidden")
        return setStep("applicant");
      throw e;
    }
  }, []);

  const restore = useCallback(async () => {
    setStep("restoring");
    const token = await sessionStore.read();
    if (!token) return setStep("phone");
    try {
      const current = await authClient.getCurrentUser(token);
      await enter(token, current);
    } catch (e) {
      // Only a rejected session is cleared; an unreachable API keeps it for a retry.
      if (e instanceof AuthError && e.code === "unauthorized") {
        await sessionStore.clear();
        setNotice("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setStep("phone");
      } else {
        setStep("restoreFailed");
      }
    }
  }, [enter]);

  useEffect(() => {
    void restore();
  }, [restore]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, [cooldown]);

  const updatePhone = useCallback((value: string) => {
    setPhone(value);
    setError("");
  }, []);

  const requestOtp = useCallback(async () => {
    if (!isLikelyVietnamesePhone(phone))
      return setError("Số chưa hợp lệ. Ví dụ: 0901 234 567.");
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await authClient.requestOtp(phone, SIGN_IN);
      setOtpValue("");
      setStep("otp");
      setCooldown(OTP_RESEND_SECONDS);
    } catch (e) {
      setError(authErrorMessage(e, "request"));
    } finally {
      setBusy(false);
    }
  }, [phone]);

  const verify = useCallback(
    async (code: string) => {
      if (verifying.current) return;
      if (!/^\d{6}$/.test(code))
        return setError("Nhập đủ 6 chữ số của mã OTP.");
      verifying.current = true;
      setBusy(true);
      setError("");
      try {
        const result = await authClient.verifyOtp(phone, code, SIGN_IN);
        if (!result.token) throw new AuthError("unknown");
        await sessionStore.write(result.token);
        await enter(result.token, result.user);
      } catch (e) {
        setError(authErrorMessage(e, "verify"));
        // A rejected code is cleared so the next attempt starts from the first cell.
        if (e instanceof AuthError && e.code === "invalid") setOtpValue("");
      } finally {
        verifying.current = false;
        setBusy(false);
      }
    },
    [phone, enter]
  );

  const updateOtp = useCallback(
    (value: string) => {
      if (verifying.current) return;
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setOtpValue(digits);
      setError("");
      if (digits.length === 6) void verify(digits);
    },
    [verify]
  );

  /** DEV quick login: the normal OTP sign-in for a seeded account. */
  const signInQuickly = useCallback(
    async (account: QuickLoginAccount) => {
      if (!quickLogin || verifying.current) return;
      verifying.current = true;
      setBusy(true);
      setError("");
      try {
        const result = await authClient.quickLogin(
          account,
          quickLogin,
          APP_ROLE
        );
        if (!result.token) throw new AuthError("unknown");
        await sessionStore.write(result.token);
        setPhone(account.phone);
        await enter(result.token, result.user);
      } catch (e) {
        setError(authErrorMessage(e, "verify"));
      } finally {
        verifying.current = false;
        setBusy(false);
      }
    },
    [quickLogin, enter]
  );

  /** After an approval is activated, re-checks access and opens the store. */
  const refreshAccess = useCallback(async () => {
    const token = await sessionStore.read();
    if (!token || !user) return;
    await enter(token, user).catch(() => undefined);
  }, [enter, user]);

  const changePhone = useCallback(() => {
    setStep("phone");
    setOtpValue("");
    setError("");
  }, []);

  const logout = useCallback(async () => {
    setBusy(true);
    const token = await sessionStore.read();
    try {
      await authClient.logout(token ?? undefined);
    } catch (e) {
      // A session the server already revoked is still a successful logout.
      if (!(e instanceof AuthError && e.code === "unauthorized"))
        setNotice(
          "Đã đăng xuất trên thiết bị này. Máy chủ hiện chưa phản hồi."
        );
    } finally {
      await sessionStore.clear();
      setUser(undefined);
      setOtpValue("");
      setStep("phone");
      setBusy(false);
    }
  }, []);

  return {
    step,
    phone,
    otp,
    busy,
    error,
    notice,
    user,
    cooldown,
    updatePhone,
    updateOtp,
    requestOtp,
    verify: () => verify(otp),
    changePhone,
    logout,
    retryRestore: restore,
    refreshAccess,
    quickLogin,
    signInQuickly
  };
}

export type AuthSession = ReturnType<typeof useAuthSession>;
