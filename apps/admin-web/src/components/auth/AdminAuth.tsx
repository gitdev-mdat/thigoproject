"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AuthError, createAuthClient, type AuthUser } from "@thigo/auth-client";

const client = createAuthClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  mode: "cookie"
});
const safeMessage = (error: unknown) =>
  error instanceof AuthError && error.code === "forbidden"
    ? "Tài khoản không có quyền truy cập ứng dụng quản trị."
    : error instanceof AuthError && error.code === "invalid"
      ? "Thông tin hoặc mã OTP không hợp lệ hoặc đã hết hạn."
      : error instanceof AuthError && error.code === "unavailable"
        ? "Dịch vụ mã xác thực tạm thời chưa sẵn sàng."
        : "Không thể kết nối. Vui lòng thử lại.";

export function AdminAuth() {
  const [step, setStep] = useState<
    "restoring" | "phone" | "otp" | "authenticated"
  >("restoring");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [user, setUser] = useState<AuthUser>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    void (async () => {
      try {
        const current = await client.getCurrentUser();
        await client.checkAccess("ADMIN");
        setUser(current);
        setStep("authenticated");
      } catch (e) {
        if (e instanceof AuthError && e.code === "forbidden")
          setError(safeMessage(e));
        setStep("phone");
      }
    })();
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [cooldown]);
  const requestOtp = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!/^\+?[0-9 ]{9,15}$/.test(phone.trim()))
      return setError("Vui lòng nhập số điện thoại hợp lệ.");
    setBusy(true);
    setError("");
    try {
      await client.requestOtp(phone, "ADMIN");
      setStep("otp");
      setCooldown(30);
    } catch (e) {
      setError(safeMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setError("Mã OTP gồm 6 chữ số.");
    setBusy(true);
    setError("");
    try {
      const result = await client.verifyOtp(phone, otp, "ADMIN");
      await client.checkAccess("ADMIN");
      setUser(result.user);
      setStep("authenticated");
    } catch (e) {
      setError(safeMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    setBusy(true);
    try {
      await client.logout();
    } catch {
      setError(
        "Đã kết thúc phiên trên trình duyệt. Máy chủ hiện không khả dụng."
      );
    } finally {
      setUser(undefined);
      setOtp("");
      setStep("phone");
      setBusy(false);
    }
  };
  if (step === "restoring")
    return (
      <main aria-busy="true">
        <p>Đang kiểm tra phiên đăng nhập…</p>
      </main>
    );
  if (step === "authenticated")
    return (
      <main>
        <section>
          <h1>Xin chào quản trị viên</h1>
          <p>Bạn đã đăng nhập vào THIGO.</p>
          <p className="supporting">{user?.phone}</p>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void logout()}
          >
            {busy ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </section>
      </main>
    );
  return (
    <main>
      <section>
        <h1>{step === "phone" ? "Đăng nhập quản trị" : "Nhập mã xác thực"}</h1>
        <p>
          {step === "phone"
            ? "Dùng số điện thoại của tài khoản quản trị."
            : `Mã OTP đã được gửi đến ${phone}.`}
        </p>
        <form onSubmit={step === "phone" ? requestOtp : verify}>
          <label htmlFor="credential">
            {step === "phone" ? "Số điện thoại" : "Mã OTP"}
          </label>
          <input
            id="credential"
            autoComplete={step === "phone" ? "tel" : "one-time-code"}
            inputMode={step === "phone" ? "tel" : "numeric"}
            maxLength={step === "otp" ? 6 : 16}
            value={step === "phone" ? phone : otp}
            onChange={(event) =>
              step === "phone"
                ? setPhone(event.target.value)
                : setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
          {error ? (
            <p role="alert" className="error">
              {error}
            </p>
          ) : null}
          <button disabled={busy} type="submit">
            {busy
              ? "Đang xử lý…"
              : step === "phone"
                ? "Gửi mã OTP"
                : "Đăng nhập"}
          </button>
        </form>
        {step === "otp" ? (
          <div className="links">
            <button
              className="tertiary"
              disabled={busy || cooldown > 0}
              onClick={() => void requestOtp()}
            >
              {cooldown ? `Gửi lại sau ${cooldown} giây` : "Gửi lại mã OTP"}
            </button>
            <button
              className="tertiary"
              disabled={busy}
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
            >
              Sửa số điện thoại
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
