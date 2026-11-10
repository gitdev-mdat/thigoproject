import { isLikelyVietnamesePhone } from "../utils/phone";
import { authErrorMessage } from "./authMessages";

export type OtpRequestPatch = {
  busy?: boolean;
  error?: string;
  notice?: string;
  otp?: string;
  step?: "otp";
  cooldown?: number;
};

/**
 * The "Gửi mã OTP" / "Gửi lại" request. Only one request runs at a time, and
 * `busy` is always cleared when it settles: success, API error, network
 * failure or timeout. A failure leaves the phone step usable for a retry.
 */
export function createOtpRequest(options: {
  send: (phone: string) => Promise<unknown>;
  apply: (patch: OtpRequestPatch) => void;
  cooldownSeconds: number;
}) {
  let inFlight = false;
  return async function requestOtp(phone: string): Promise<void> {
    if (inFlight) return;
    if (!isLikelyVietnamesePhone(phone)) {
      options.apply({ error: "Số chưa hợp lệ. Ví dụ: 0901 234 567." });
      return;
    }
    inFlight = true;
    options.apply({ busy: true, error: "", notice: "" });
    try {
      await options.send(phone);
      options.apply({
        otp: "",
        step: "otp",
        cooldown: options.cooldownSeconds
      });
    } catch (error) {
      options.apply({ error: authErrorMessage(error, "request") });
    } finally {
      inFlight = false;
      options.apply({ busy: false });
    }
  };
}
