import { describe, expect, it } from "vitest";

describe("auth entity metadata", () => {
  it("loads every auth entity without circular ESM initialization errors", async () => {
    const [user, userRole, otpChallenge, session] = await Promise.all([
      import("../entities/auth/user.entity.js"),
      import("../entities/auth/user-role.entity.js"),
      import("../entities/auth/otp-challenge.entity.js"),
      import("../entities/auth/session.entity.js")
    ]);

    expect([
      user.User,
      userRole.UserRole,
      otpChallenge.OtpChallenge,
      session.Session
    ]).toHaveLength(4);
  });
});
