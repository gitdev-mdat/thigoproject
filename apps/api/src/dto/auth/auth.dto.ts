import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
export class RequestOtpDto {
  phone!: string;
  application!: ApplicationRole;
}
export class VerifyOtpDto extends RequestOtpDto {
  otp!: string;
}
