import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, IsNull, MoreThan } from "typeorm";
import { OtpChallenge } from "../../entities/auth/otp-challenge.entity.js";
import { Session } from "../../entities/auth/session.entity.js";
import {
  UserRole,
  ApplicationRole
} from "../../entities/auth/user-role.entity.js";
import { User } from "../../entities/auth/user.entity.js";
import {
  MERCHANT_APPLICANT,
  type SignInPurpose
} from "../../common/auth/sign-in-purpose.js";
@Injectable()
export class AuthRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}
  async latestChallenge(phone: string) {
    return this.db
      .getRepository(OtpChallenge)
      .findOne({ where: { phone }, order: { createdAt: "DESC" } });
  }
  async createChallenge(values: Partial<OtpChallenge>) {
    return this.db
      .getRepository(OtpChallenge)
      .save(this.db.getRepository(OtpChallenge).create(values));
  }
  async failChallenge(id: string) {
    await this.db
      .getRepository(OtpChallenge)
      .increment({ id }, "attemptCount", 1);
  }
  async consumeAndCreateSession(
    challengeId: string,
    phone: string,
    role: SignInPurpose,
    tokenHash: string,
    expiresAt: Date
  ): Promise<User | null> {
    return this.db.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .update(OtpChallenge)
        .set({ consumedAt: new Date() })
        .where(
          "id = :id AND consumed_at IS NULL AND expires_at > now() AND attempt_count < attempt_limit",
          { id: challengeId }
        )
        .execute();
      if (result.affected !== 1) return null;
      let user = await manager
        .getRepository(User)
        .findOne({ where: { phone }, relations: { roles: true } });
      // A new phone may become a customer (F01). A merchant applicant gets
      // that same customer account; the MERCHANT role only comes from an
      // Admin approval (see MerchantApplicationService).
      if (
        !user &&
        (role === ApplicationRole.CUSTOMER || role === MERCHANT_APPLICANT)
      ) {
        const customer = ApplicationRole.CUSTOMER;
        user = await manager
          .getRepository(User)
          .save(manager.getRepository(User).create({ phone }));
        await manager
          .getRepository(UserRole)
          .save({ userId: user.id, role: customer });
        user.roles = [{ userId: user.id, role: customer } as UserRole];
      }
      if (!user || !user.isActive) return null;
      // Admin sessions only come from the Admin web's httpOnly cookie sign-in.
      if (
        role === MERCHANT_APPLICANT &&
        user.roles.some((item) => item.role === ApplicationRole.ADMIN)
      )
        return null;
      if (
        role !== MERCHANT_APPLICANT &&
        !user.roles.some((item) => item.role === role)
      )
        return null;
      await manager
        .getRepository(Session)
        .save({ userId: user.id, tokenHash, expiresAt, revokedAt: null });
      return user;
    });
  }
  async resolveSession(tokenHash: string) {
    return this.db.getRepository(Session).findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date())
      },
      relations: { user: { roles: true } }
    });
  }
  async revoke(id: string) {
    await this.db
      .getRepository(Session)
      .update({ id, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}
