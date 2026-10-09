import type { SignInPurpose } from "../../common/auth/sign-in-purpose.js";

export {
  MERCHANT_APPLICANT,
  isSignInPurpose,
  type SignInPurpose
} from "../../common/auth/sign-in-purpose.js";

export class RequestOtpDto {
  phone!: string;
  application!: SignInPurpose;
}
export class VerifyOtpDto extends RequestOtpDto {
  otp!: string;
}
