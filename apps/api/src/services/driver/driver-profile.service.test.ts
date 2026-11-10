import { describe, expect, it } from "vitest";

import type { DriverLocationInput } from "../../dto/driver/driver.dto.js";
import type { DriverPresence } from "../../entities/driver/driver-presence.entity.js";
import {
  acceptableLocationTime,
  presenceEligibility,
  shouldPersistLocation
} from "./driver-profile.service.js";

const at = new Date("2026-10-13T10:00:00.000Z");

function presence(overrides: Partial<DriverPresence> = {}): DriverPresence {
  return {
    userId: "driver",
    isOnline: true,
    lastHeartbeatAt: at,
    latitude: 10.7769,
    longitude: 106.7009,
    locationAccuracyMeters: 15,
    headingDegrees: null,
    speedMetersPerSecond: null,
    locationRecordedAt: at,
    updatedAt: at,
    ...overrides
  };
}

function location(
  overrides: Partial<DriverLocationInput> = {}
): DriverLocationInput {
  return {
    latitude: 10.7769,
    longitude: 106.7009,
    accuracyMeters: 15,
    headingDegrees: null,
    speedMetersPerSecond: null,
    recordedAt: new Date(at.getTime() + 5_000),
    ...overrides
  };
}

describe("driver presence policy", () => {
  it("rejects stale and far-future samples", () => {
    expect(
      acceptableLocationTime(new Date(at.getTime() - 5 * 60_000 - 1), at)
    ).toBe(false);
    expect(acceptableLocationTime(new Date(at.getTime() + 30_001), at)).toBe(
      false
    );
  });

  it("suppresses insignificant frequent location writes", () => {
    expect(shouldPersistLocation(presence(), location())).toBe(false);
  });

  it("persists movement, elapsed updates, and materially better accuracy", () => {
    expect(
      shouldPersistLocation(presence(), location({ latitude: 10.7773 }))
    ).toBe(true);
    expect(
      shouldPersistLocation(
        presence(),
        location({ recordedAt: new Date(at.getTime() + 20_000) })
      )
    ).toBe(true);
    expect(
      shouldPersistLocation(
        presence({ locationAccuracyMeters: 60 }),
        location({ accuracyMeters: 10 })
      )
    ).toBe(true);
  });

  it("requires online, fresh, accurate GPS for offers", () => {
    expect(
      presenceEligibility(presence(), new Date(at.getTime() + 30_000))
    ).toEqual({
      heartbeatFresh: true,
      locationFresh: true,
      accurate: true
    });
    expect(
      presenceEligibility(presence(), new Date(at.getTime() + 121_000))
        .locationFresh
    ).toBe(false);
  });
});
