import { describe, expect, it } from "vitest";
import { readAuthEnvironment } from "./auth-environment.js";
describe("readAuthEnvironment", () => {
  it("rejects test OTP in production", () =>
    expect(() =>
      readAuthEnvironment({ NODE_ENV: "production", OTP_PROVIDER: "test" })
    ).toThrow("forbidden"));
  it("defaults fail closed", () =>
    expect(readAuthEnvironment({}).otpProvider).toBe("disabled"));
  it("rejects invalid controls", () =>
    expect(() => readAuthEnvironment({ OTP_EXPIRY_SECONDS: "0" })).toThrow(
      "positive integer"
    ));
});
