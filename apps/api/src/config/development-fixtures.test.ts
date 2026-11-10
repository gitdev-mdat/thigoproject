import { describe, expect, it } from "vitest";
import { readAuthEnvironment } from "./auth-environment.js";
import {
  assertDevelopmentFixturesEnabled,
  developmentFixturesEnabled
} from "./development-fixtures.js";

const flag = (value: string | undefined, nodeEnv: string | undefined) => {
  const env: NodeJS.ProcessEnv = {};
  if (value !== undefined) env.THIGO_ENABLE_DEV_FIXTURES = value;
  if (nodeEnv !== undefined) env.NODE_ENV = nodeEnv;
  return env;
};

describe("developmentFixturesEnabled", () => {
  it("is off in development without the opt-in flag", () => {
    expect(developmentFixturesEnabled(flag(undefined, "development"))).toBe(
      false
    );
    expect(developmentFixturesEnabled(flag("false", "development"))).toBe(
      false
    );
    expect(developmentFixturesEnabled(flag("", "development"))).toBe(false);
  });

  it("is on only with the flag in an approved non-production runtime", () => {
    expect(developmentFixturesEnabled(flag("true", "development"))).toBe(true);
    expect(developmentFixturesEnabled(flag("true", "test"))).toBe(true);
  });

  it("is off in production without the flag", () => {
    expect(developmentFixturesEnabled(flag(undefined, "production"))).toBe(
      false
    );
  });

  it("refuses production even when the flag is set", () => {
    expect(() =>
      developmentFixturesEnabled(flag("true", "production"))
    ).toThrow("forbidden in production");
  });

  it("fails closed when the environment is missing or unknown", () => {
    expect(developmentFixturesEnabled({})).toBe(false);
    expect(developmentFixturesEnabled(flag("true", undefined))).toBe(false);
    expect(developmentFixturesEnabled(flag("true", "staging"))).toBe(false);
    expect(developmentFixturesEnabled(flag("true", "Development"))).toBe(false);
  });

  it("rejects ambiguous flag values", () => {
    for (const value of ["1", "yes", "TRUE", " true", "on"])
      expect(() =>
        developmentFixturesEnabled(flag(value, "development"))
      ).toThrow("must be true or false");
  });

  it("explains how to opt in when an operation is refused", () => {
    expect(() =>
      assertDevelopmentFixturesEnabled(
        flag(undefined, "development"),
        "dev:seed"
      )
    ).toThrow(
      "dev:seed needs THIGO_ENABLE_DEV_FIXTURES=true and NODE_ENV=development (or test)."
    );
    expect(() =>
      assertDevelopmentFixturesEnabled(flag("true", "development"), "dev:seed")
    ).not.toThrow();
  });
});

describe("fixed test OTP", () => {
  const otp = (value: string | undefined, nodeEnv: string | undefined) => ({
    ...flag(value, nodeEnv),
    OTP_PROVIDER: "test"
  });

  it("needs the opt-in flag", () => {
    expect(() => readAuthEnvironment(otp(undefined, "development"))).toThrow(
      "OTP_PROVIDER=test needs THIGO_ENABLE_DEV_FIXTURES=true"
    );
    expect(() => readAuthEnvironment(otp("true", undefined))).toThrow(
      "OTP_PROVIDER=test needs"
    );
    expect(readAuthEnvironment(otp("true", "development")).otpProvider).toBe(
      "test"
    );
  });

  it("is refused in production with or without the flag", () => {
    expect(() => readAuthEnvironment(otp(undefined, "production"))).toThrow(
      "forbidden in production"
    );
    expect(() => readAuthEnvironment(otp("true", "production"))).toThrow(
      "forbidden in production"
    );
  });

  it("stays off by default", () => {
    expect(readAuthEnvironment({}).otpProvider).toBe("disabled");
    expect(readAuthEnvironment({ NODE_ENV: "production" }).otpProvider).toBe(
      "disabled"
    );
  });
});
