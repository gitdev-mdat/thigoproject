import { AuthError } from "@thigo/auth-client";

export const CONNECTION_FAILED_MESSAGE =
  "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
export const TIMEOUT_MESSAGE =
  "Máy chủ phản hồi quá lâu. Kiểm tra mạng rồi thử lại.";

export function authErrorMessage(
  error: unknown,
  stage: "request" | "verify"
): string {
  if (!(error instanceof AuthError)) return CONNECTION_FAILED_MESSAGE;
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
    case "timeout":
      return TIMEOUT_MESSAGE;
    case "network":
      return CONNECTION_FAILED_MESSAGE;
    default:
      return "Đã có lỗi xảy ra. Vui lòng thử lại.";
  }
}
