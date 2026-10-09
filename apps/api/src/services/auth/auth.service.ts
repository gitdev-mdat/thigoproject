import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { readAuthEnvironment } from "../../config/auth-environment.js";
import {
  hashSecret,
  createSessionToken,
  verifySecret
} from "../../common/auth/crypto.js";
import { canonicalizeVietnamesePhone } from "../../common/auth/phone-number.js";
import type { SignInPurpose } from "../../dto/auth/auth.dto.js";
import { AuthRepository } from "../../repositories/auth/auth.repository.js";
import { developmentQuickLoginAccounts } from "../../development/auth-fixtures.js";

/**
 * The resend cooldown throttles real code deliveries. The test provider sends
 * nothing, so once its latest code has been used to sign in, a new one may be
 * requested at once (sign out, then quick login again). A pending code still
 * waits for the cooldown under every provider.
 */
export function otpResendBlocked(
  latest: { resendAfter: Date; consumedAt: Date | null } | null,
  otpProvider: string,
  now = new Date()
): boolean {
  if (!latest || latest.resendAfter <= now) return false;
  return !(otpProvider === "test" && latest.consumedAt);
}

@Injectable()
export class AuthService {
  private readonly config = readAuthEnvironment(process.env);
  constructor(private readonly repository: AuthRepository) {}
  async requestOtp(phoneInput: string) {
    const phone = this.phone(phoneInput);
    const latest = await this.repository.latestChallenge(phone);
    if (otpResendBlocked(latest, this.config.otpProvider))
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
  async verifyOtp(phoneInput: string, otp: string, role: SignInPurpose) {
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
  /** Seeded accounts for the DEV quick login, or none outside local development. */
  quickLoginAccounts(application: string) {
    return developmentQuickLoginAccounts(process.env, application);
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
