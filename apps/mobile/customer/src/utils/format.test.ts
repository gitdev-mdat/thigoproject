import { describe, expect, it } from "vitest";

import { formatCount, formatRating, formatVnd } from "./format";

describe("format helpers", () => {
  it("formats integer VND with dot grouping", () => {
    expect(formatVnd(55000)).toBe("55.000 ₫");
    expect(formatVnd(1250000)).toBe("1.250.000 ₫");
    expect(formatVnd(900)).toBe("900 ₫");
  });

  it("formats counts and ratings the Vietnamese way", () => {
    expect(formatCount(856)).toBe("856");
    expect(formatCount(1240)).toBe("1,2k");
    expect(formatCount(2000)).toBe("2k");
    expect(formatRating(4.8)).toBe("4,8");
  });
});
