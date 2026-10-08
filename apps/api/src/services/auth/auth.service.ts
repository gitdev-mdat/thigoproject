import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { readAuthEnvironment } from "../../config/auth-environment.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  hashSecret,
  createSessionToken,
  verifySecret
} from "../../common/auth/crypto.js";
import { canonicalizeVietnamesePhone } from "../../common/auth/phone-number.js";
import { AuthRepository } from "../../repositories/auth/auth.repository.js";
@Injectable()
export class AuthService {
  private readonly config = readAuthEnvironment(process.env);
  constructor(private readonly repository: AuthRepository) {}
  async requestOtp(phoneInput: string) {
    const phone = this.phone(phoneInput);
    const latest = await this.repository.latestChallenge(phone);
    if (latest && latest.resendAfter > new Date())
      throw new BadRequestException("Vui lòng chờ trước khi gửi lại mã.");
    if (this.config.otpProvider !== "test")
      throw new ServiceUnavailableException("Dịch vụ OTP chưa sẵn sàng.");
    const now = Date.now();
    await this.repository.createChallenge({
      phone,
      otpHash: hashSecret("000000"),
      expiresAt: new Date(now + this.config.otpExpirySeconds * 1000),
      resendAfter: new Date(now + this.config.otpResendSeconds * 1000),
      attemptLimit: this.config.otpAttemptLimit,
      attemptCount: 0,
      consumedAt: null
    });
    return { accepted: true };
  }
  async verifyOtp(phoneInput: string, otp: string, role: ApplicationRole) {
    const phone = this.phone(phoneInput);
    const challenge = await this.repository.latestChallenge(phone);
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt <= new Date() ||
      challenge.attemptCount >= challenge.attemptLimit
    )
      throw new BadRequestException(
        "Mã xác thực không hợp lệ hoặc đã hết hạn."
      );
    if (!/^\d{6}$/.test(otp) || !verifySecret(otp, challenge.otpHash)) {
      await this.repository.failChallenge(challenge.id);
      throw new BadRequestException("Mã xác thực không đúng.");
    }
    const token = createSessionToken();
    const user = await this.repository.consumeAndCreateSession(
      challenge.id,
      phone,
      role,
      hashSecret(token),
      new Date(Date.now() + this.config.sessionExpirySeconds * 1000)
    );
    if (!user)
      throw new ForbiddenException("Tài khoản chưa được cấp quyền truy cập.");
    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        roles: user.roles.map((item) => item.role)
      }
    };
  }
  async authenticate(token: string) {
    const session = await this.repository.resolveSession(hashSecret(token));
    if (!session || !session.user.isActive) throw new UnauthorizedException();
    return session;
  }
  async logout(token: string) {
    const session = await this.authenticate(token);
    await this.repository.revoke(session.id);
  }
  private phone(value: string) {
    try {
      return canonicalizeVietnamesePhone(value);
    } catch {
      throw new BadRequestException("Số điện thoại không hợp lệ.");
    }
  }
}
