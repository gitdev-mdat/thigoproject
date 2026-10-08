import { describe, expect, it, vi } from "vitest";

import { ApplicationRole } from "../entities/auth/user-role.entity.js";
import {
  assertDevelopmentSeedEnvironment,
  DEVELOPMENT_AUTH_FIXTURES,
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
