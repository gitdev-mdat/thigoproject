import { describe, expect, it } from "vitest";

import {
  formatCountdown,
  formatPhone,
  isLikelyVietnamesePhone,
  maskPhone
} from "./phone";

describe("phone helpers", () => {
  it("accepts local and international Vietnamese mobile formats", () => {
    expect(isLikelyVietnamesePhone("0901 234 567")).toBe(true);
    expect(isLikelyVietnamesePhone("+84901234567")).toBe(true);
    expect(isLikelyVietnamesePhone("0101234567")).toBe(false);
    expect(isLikelyVietnamesePhone("12345")).toBe(false);
  });

  it("groups digits for scanning without changing the number", () => {
    expect(formatPhone("0901234567")).toBe("0901 234 567");
    expect(formatPhone("+84901234567")).toBe("+84 901 234 567");
    expect(formatPhone("12345")).toBe("12345");
  });

  it("masks the middle group of a known number", () => {
    expect(maskPhone("+84901234567")).toBe("+84 901 *** 567");
  });

  it("formats the resend countdown as minutes and seconds", () => {
    expect(formatCountdown(60)).toBe("1:00");
    expect(formatCountdown(9)).toBe("0:09");
  });
});
