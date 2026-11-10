"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { QuickLoginAccount } from "@thigo/auth-client";

import { authMessage, useAdminSession } from "../../hooks/useAdminSession";
import { authClient } from "../../services/api";
import { formatPhone } from "../format";
import { Icon } from "../ui";

export function AdminLogin() {
  const { notice, quickLogin, signedIn, signInQuickly } = useAdminSession();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState<"form" | string | null>(null);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

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
    setBusy("form");
    setError("");
    try {
      await authClient.requestOtp(phone, "ADMIN");
      setStep("otp");
      setCooldown(60);
    } catch (e) {
      setError(authMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setError("Mã OTP gồm 6 chữ số.");
    setBusy("form");
    setError("");
    try {
      const result = await authClient.verifyOtp(phone, otp, "ADMIN");
      await authClient.checkAccess("ADMIN");
      signedIn(result.user);
    } catch (e) {
      setError(authMessage(e));
      setBusy(null);
    }
  };

  const quick = async (account: QuickLoginAccount) => {
    setBusy(account.phone);
    setError("");
    try {
      await signInQuickly(account);
    } catch (e) {
      setError(authMessage(e));
      setBusy(null);
    }
  };

  return (
    <main className="login">
      <section className="login-brand" aria-hidden="true">
        <div className="brand-mark large">T</div>
        <p className="login-brand-title">THIGO Quản trị</p>
        <p className="login-brand-copy">
          Theo dõi cửa hàng, đơn hàng và tài xế trong một nơi.
        </p>
      </section>
      <section className="login-card">
        <div className="brand-row">
          <span className="brand-mark">T</span>
          <span className="brand-name">THIGO</span>
          <span className="chip">Quản trị</span>
        </div>
        <div>
          <h1>
            {step === "phone" ? "Đăng nhập quản trị" : "Nhập mã xác thực"}
          </h1>
          <p className="muted">
            {step === "phone"
              ? "Dùng số điện thoại của tài khoản quản trị."
              : `Mã OTP đã được gửi đến ${phone}.`}
          </p>
        </div>
        {notice && !error ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : null}
        <form onSubmit={step === "phone" ? requestOtp : verify}>
          <label htmlFor="credential">
            {step === "phone" ? "Số điện thoại" : "Mã OTP"}
          </label>
          <input
            id="credential"
            autoComplete={step === "phone" ? "tel" : "one-time-code"}
            inputMode={step === "phone" ? "tel" : "numeric"}
            maxLength={step === "otp" ? 6 : 16}
            placeholder={step === "phone" ? "0901 234 567" : "6 chữ số"}
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
          <button
            className="button primary block"
            disabled={busy !== null}
            type="submit"
          >
            {busy === "form"
              ? "Đang xử lý…"
              : step === "phone"
                ? "Gửi mã OTP"
                : "Đăng nhập"}
          </button>
        </form>
        {step === "otp" ? (
          <div className="login-links">
            <button
              className="button tertiary"
              type="button"
              disabled={busy !== null || cooldown > 0}
              onClick={() => void requestOtp()}
            >
              {cooldown ? `Gửi lại sau ${cooldown} giây` : "Gửi lại mã OTP"}
            </button>
            <button
              className="button tertiary"
              type="button"
              disabled={busy !== null}
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
        {quickLogin?.accounts.length ? (
          <div className="dev-login">
            <div className="dev-login-head">
              <span className="dev-tag">DEV</span>
              <span className="small muted">
                Chỉ có khi chạy cục bộ với dữ liệu mẫu.
              </span>
            </div>
            {quickLogin.accounts.map((account) => (
              <button
                key={account.phone}
                type="button"
                className="button dev block"
                disabled={busy !== null}
                onClick={() => void quick(account)}
              >
                <Icon name="bolt" size={18} />
                {busy === account.phone
                  ? "Đang đăng nhập…"
                  : "Đăng nhập nhanh (DEV)"}
                <span className="dev-account">
                  {account.label} · {formatPhone(account.phone)}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
