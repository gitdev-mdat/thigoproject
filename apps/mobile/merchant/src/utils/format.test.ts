import { describe, expect, it } from "vitest";

import {
  elapsedMinutes,
  formatClock,
  formatElapsed,
  formatPlacedAt,
  formatVnd
} from "./format";

// Built from local components so the tests hold in any device time zone.
const at = (day: number, hours: number, minutes: number, seconds = 0) =>
  new Date(2026, 9, day, hours, minutes, seconds);

describe("formatVnd", () => {
  it("formats integer VND with dot grouping", () => {
    expect(formatVnd(146000)).toBe("146.000 ₫");
    expect(formatVnd(1250000)).toBe("1.250.000 ₫");
    expect(formatVnd(900)).toBe("900 ₫");
    expect(formatVnd(0)).toBe("0 ₫");
  });
});

describe("time helpers", () => {
  it("formats a 24-hour clock with leading zeros", () => {
    expect(formatClock(at(8, 9, 5))).toBe("09:05");
    expect(formatClock(at(8, 23, 59).toISOString())).toBe("23:59");
  });

  it("counts whole elapsed minutes and ignores clock skew", () => {
    const placed = at(8, 12, 5).toISOString();
    expect(elapsedMinutes(placed, at(8, 12, 5, 59).getTime())).toBe(0);
    expect(elapsedMinutes(placed, at(8, 12, 8, 30).getTime())).toBe(3);
    expect(elapsedMinutes(placed, at(8, 12, 4).getTime())).toBe(0);
  });

  it("describes elapsed time in Vietnamese", () => {
    expect(formatElapsed(0)).toBe("Vừa xong");
    expect(formatElapsed(3)).toBe("3 phút trước");
    expect(formatElapsed(60)).toBe("1 giờ trước");
    expect(formatElapsed(65)).toBe("1 giờ 5 phút trước");
    expect(formatElapsed(60 * 24 * 2 + 5)).toBe("2 ngày trước");
  });

  it("shows placed time with its age, adding the date for earlier days", () => {
    const placed = at(8, 12, 5).toISOString();
    expect(formatPlacedAt(placed, at(8, 12, 8).getTime())).toBe(
      "12:05 · 3 phút trước"
    );
    expect(formatPlacedAt(placed, at(9, 13, 0).getTime())).toBe(
      "08/10 12:05 · 1 ngày trước"
    );
  });
});
