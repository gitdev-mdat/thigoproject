"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  AuthError,
  type AuthUser,
  type QuickLoginAccount,
  type QuickLoginOffer
} from "@thigo/auth-client";

import { authClient } from "../services/api";

type SessionState = "restoring" | "anonymous" | "authenticated";

interface AdminSession {
  state: SessionState;
  user: AuthUser | undefined;
  /** Message to show on the sign-in screen, e.g. after a refused account. */
  notice: string;
  quickLogin: QuickLoginOffer | null;
  signedIn: (user: AuthUser) => void;
  signInQuickly: (account: QuickLoginAccount) => Promise<void>;
  signOut: () => Promise<void>;
  /** Drops a session the API no longer accepts (expired or revoked). */
  expire: () => void;
}

const SessionContext = createContext<AdminSession | null>(null);

export const authMessage = (error: unknown) =>
  error instanceof AuthError && error.code === "forbidden"
    ? "Tài khoản không có quyền truy cập ứng dụng quản trị."
    : error instanceof AuthError && error.code === "invalid"
      ? "Thông tin hoặc mã OTP không hợp lệ hoặc đã hết hạn."
      : error instanceof AuthError && error.code === "unavailable"
        ? "Dịch vụ mã xác thực tạm thời chưa sẵn sàng."
        : "Không thể kết nối máy chủ. Vui lòng thử lại.";

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>("restoring");
  const [user, setUser] = useState<AuthUser>();
  const [notice, setNotice] = useState("");
  const [quickLogin, setQuickLogin] = useState<QuickLoginOffer | null>(null);

  useEffect(() => {
    void authClient.getQuickLoginOffer("ADMIN").then(setQuickLogin);
    void (async () => {
      try {
        const current = await authClient.getCurrentUser();
        await authClient.checkAccess("ADMIN");
        setUser(current);
        setState("authenticated");
      } catch (error) {
        if (error instanceof AuthError && error.code === "forbidden")
          setNotice(authMessage(error));
        setState("anonymous");
      }
    })();
  }, []);

  const signedIn = useCallback((next: AuthUser) => {
    setUser(next);
    setNotice("");
    setState("authenticated");
  }, []);

  const signInQuickly = useCallback(
    async (account: QuickLoginAccount) => {
      if (!quickLogin) return;
      const result = await authClient.quickLogin(account, quickLogin, "ADMIN");
      await authClient.checkAccess("ADMIN");
      signedIn(result.user);
    },
    [quickLogin, signedIn]
  );

  const signOut = useCallback(async () => {
    try {
      await authClient.logout();
      setNotice("");
    } catch {
      setNotice(
        "Đã đăng xuất trên trình duyệt này. Máy chủ chưa xác nhận kết thúc phiên."
      );
    } finally {
      setUser(undefined);
      setState("anonymous");
    }
  }, []);

  const expire = useCallback(() => {
    setUser(undefined);
    setNotice("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    setState("anonymous");
  }, []);

  const value = useMemo(
    () => ({
      state,
      user,
      notice,
      quickLogin,
      signedIn,
      signInQuickly,
      signOut,
      expire
    }),
    [state, user, notice, quickLogin, signedIn, signInQuickly, signOut, expire]
  );
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useAdminSession(): AdminSession {
  const session = useContext(SessionContext);
  if (!session) throw new Error("AdminSessionProvider is missing.");
  return session;
}
