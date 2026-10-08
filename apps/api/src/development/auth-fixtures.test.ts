import { describe, expect, it, vi } from "vitest";

import { ApplicationRole } from "../entities/auth/user-role.entity.js";
import {
  assertDevelopmentSeedEnvironment,
  DEVELOPMENT_AUTH_FIXTURES,
  seedDevelopmentAuthFixtures
} from "./auth-fixtures.js";

describe("development auth fixtures", () => {
  it("refuses to seed in production", () => {
    expect(() =>
      assertDevelopmentSeedEnvironment({ NODE_ENV: "production" })
    ).toThrow(
      "dev:seed is development-only and cannot run when NODE_ENV=production."
    );
  });

  it("allows an explicit or implicit development environment", () => {
    expect(() => assertDevelopmentSeedEnvironment({})).not.toThrow();
    expect(() =>
      assertDevelopmentSeedEnvironment({ NODE_ENV: "development" })
    ).not.toThrow();
  });

  it("ensures the four deterministic canonical accounts", async () => {
    const ensureAccount = vi.fn(async () => undefined);

    await seedDevelopmentAuthFixtures({ ensureAccount });

    expect(DEVELOPMENT_AUTH_FIXTURES).toHaveLength(4);
    expect(ensureAccount.mock.calls).toEqual([
      ["+84860000001", ApplicationRole.CUSTOMER],
      ["+84860000002", ApplicationRole.MERCHANT],
      ["+84860000003", ApplicationRole.DRIVER],
      ["+84860000004", ApplicationRole.ADMIN]
    ]);
  });
});
