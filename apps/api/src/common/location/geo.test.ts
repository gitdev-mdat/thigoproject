import { describe, expect, it } from "vitest";

import { haversineMeters } from "./geo.js";

describe("haversineMeters", () => {
  it("returns zero for the same position", () => {
    expect(
      haversineMeters(
        { latitude: 10.7769, longitude: 106.7009 },
        { latitude: 10.7769, longitude: 106.7009 }
      )
    ).toBe(0);
  });

  it("provides a stable straight-line prefilter distance", () => {
    const meters = haversineMeters(
      { latitude: 10.7769, longitude: 106.7009 },
      { latitude: 10.7869, longitude: 106.7009 }
    );
    expect(meters).toBeGreaterThan(1_100);
    expect(meters).toBeLessThan(1_120);
  });
});
