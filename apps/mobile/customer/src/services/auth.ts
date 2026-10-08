import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  AuthError,
  createAuthClient,
  type ApplicationRole
} from "@thigo/auth-client";

export const APP_ROLE: ApplicationRole = "CUSTOMER";
/** Matches the API default `OTP_RESEND_SECONDS`. */
export const OTP_RESEND_SECONDS = 60;

const sessionKey = "thigo.customer.session";
const env = (
  globalThis as { process?: { env?: { EXPO_PUBLIC_API_URL?: string } } }
).process?.env;

export const apiBaseUrl =
  env?.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:3001"
    : "http://localhost:3001");

export const authClient = createAuthClient({
  baseUrl: apiBaseUrl,
  mode: "bearer"
});

export const sessionStore = {
  read: () => SecureStore.getItemAsync(sessionKey),
  write: (token: string) => SecureStore.setItemAsync(sessionKey, token),
  clear: () => SecureStore.deleteItemAsync(sessionKey)
};

export function authErrorMessage(
  error: unknown,
  stage: "request" | "verify"
): string {
  if (!(error instanceof AuthError))
    return "Không thể kết nối. Vui lòng thử lại.";
  switch (error.code) {
    case "forbidden":
      return "Số điện thoại này chưa được phép dùng ứng dụng Khách hàng.";
    case "invalid":
      // The API answers 400 for an invalid phone, a resend cooldown, or a wrong code.
      return stage === "verify"
        ? "Mã OTP không đúng hoặc đã hết hạn."
        : "Chưa gửi được mã. Kiểm tra số điện thoại hoặc đợi giây lát rồi thử lại.";
    case "cooldown":
      return "Bạn vừa yêu cầu mã. Vui lòng đợi rồi thử lại.";
    case "unavailable":
      return "Dịch vụ gửi mã tạm thời chưa sẵn sàng.";
    default:
      return "Không thể kết nối. Vui lòng thử lại.";
  }
}
