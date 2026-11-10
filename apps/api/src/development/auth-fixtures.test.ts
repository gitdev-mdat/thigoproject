import { describe, expect, it, vi } from "vitest";

import { ApplicationRole } from "../entities/auth/user-role.entity.js";
import {
  assertDevelopmentSeedEnvironment,
  DEVELOPMENT_AUTH_FIXTURES,
  DEVELOPMENT_QUICK_LOGIN_ACCOUNTS,
  developmentQuickLoginAccounts,
  seedDevelopmentAuthFixtures
} from "./auth-fixtures.js";

describe("development auth fixtures", () => {
  it("refuses to seed without the opt-in flag or in production", () => {
    expect(() => assertDevelopmentSeedEnvironment({})).toThrow(
      "dev:seed needs THIGO_ENABLE_DEV_FIXTURES=true"
    );
    expect(() =>
      assertDevelopmentSeedEnvironment({ NODE_ENV: "development" })
    ).toThrow("dev:seed needs THIGO_ENABLE_DEV_FIXTURES=true");
    expect(() =>
      assertDevelopmentSeedEnvironment({
        NODE_ENV: "production",
        THIGO_ENABLE_DEV_FIXTURES: "true"
      })
    ).toThrow("forbidden in production");
  });

  it("seeds only when development fixtures are opted in", () => {
    expect(() =>
      assertDevelopmentSeedEnvironment({
        NODE_ENV: "development",
        THIGO_ENABLE_DEV_FIXTURES: "true"
      })
    ).not.toThrow();
  });

  it("ensures the deterministic canonical accounts", async () => {
    const ensureAccount = vi.fn(async () => undefined);

    await seedDevelopmentAuthFixtures({ ensureAccount });

    expect(DEVELOPMENT_AUTH_FIXTURES).toHaveLength(5);
    expect(ensureAccount.mock.calls).toEqual([
      ["+84860000001", ApplicationRole.CUSTOMER],
      ["+84860000002", ApplicationRole.MERCHANT],
      ["+84860000003", ApplicationRole.DRIVER],
      ["+84860000004", ApplicationRole.ADMIN],
      ["+84860000005", ApplicationRole.MERCHANT]
    ]);
  });
});

describe("development quick login accounts", () => {
  const enabled = {
    NODE_ENV: "development",
    THIGO_ENABLE_DEV_FIXTURES: "true",
    OTP_PROVIDER: "test"
  };

  it("offers only the seeded admin account to the admin application", () => {
    expect(developmentQuickLoginAccounts(enabled, "ADMIN")).toEqual([
      { phone: "0860000004", label: "Quản trị viên" }
    ]);
  });

  it("maps every shortcut to a seeded account holding that role", () => {
    const seeded = [
      ...DEVELOPMENT_AUTH_FIXTURES,
      { phone: "0860000201", role: ApplicationRole.DRIVER }
    ];
    for (const account of DEVELOPMENT_QUICK_LOGIN_ACCOUNTS)
      expect(seeded).toContainEqual({
        phone: account.phone,
        role: account.role
      });
  });

  it("returns nothing for an unknown application", () => {
    expect(developmentQuickLoginAccounts(enabled, "ROOT")).toEqual([]);
    expect(developmentQuickLoginAccounts(enabled, "admin")).toEqual([]);
  });

  it.each([
    {},
    { ...enabled, THIGO_ENABLE_DEV_FIXTURES: "false" },
    { ...enabled, OTP_PROVIDER: "disabled" },
    { ...enabled, NODE_ENV: "staging" },
    { ...enabled, NODE_ENV: undefined }
  ])("offers nothing unless fixtures and the test OTP are on (%o)", (env) => {
    expect(developmentQuickLoginAccounts(env, "ADMIN")).toEqual([]);
  });

  it("refuses production even if both settings leak into it", () => {
    expect(() =>
      developmentQuickLoginAccounts(
        { ...enabled, NODE_ENV: "production" },
        "ADMIN"
      )
    ).toThrow("forbidden in production");
  });
});
