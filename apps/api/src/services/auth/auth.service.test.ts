import { describe, expect, it } from "vitest";

import { otpResendBlocked } from "./auth.service.js";

describe("otpResendBlocked", () => {
  const now = new Date("2026-10-09T12:00:00Z");
  const later = new Date("2026-10-09T12:00:30Z");
  const earlier = new Date("2026-10-09T11:59:00Z");

  it("allows a first request and one after the cooldown", () => {
    expect(otpResendBlocked(null, "test", now)).toBe(false);
    expect(
      otpResendBlocked({ resendAfter: earlier, consumedAt: null }, "test", now)
    ).toBe(false);
  });

  it("keeps the cooldown while a code is still pending", () => {
    for (const provider of ["test", "disabled"])
      expect(
        otpResendBlocked(
          { resendAfter: later, consumedAt: null },
          provider,
          now
        )
      ).toBe(true);
  });

  it("lets the test provider issue a new code once the last one signed in", () => {
    expect(
      otpResendBlocked({ resendAfter: later, consumedAt: now }, "test", now)
    ).toBe(false);
  });

  it("never relaxes the cooldown for a real provider", () => {
    expect(
      otpResendBlocked({ resendAfter: later, consumedAt: now }, "disabled", now)
    ).toBe(true);
  });
});
