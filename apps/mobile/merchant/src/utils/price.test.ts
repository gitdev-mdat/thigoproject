import { describe, expect, it } from "vitest";

import { formatPriceInput, parsePrice, priceDigits, priceError } from "./price";

describe("price input", () => {
  it("keeps only digits and drops leading zeros", () => {
    expect(priceDigits("35.000 ₫")).toBe("35000");
    expect(priceDigits("00120")).toBe("120");
    expect(priceDigits("0")).toBe("0");
    expect(priceDigits("1234567890123")).toBe("123456789");
  });

  it("parses typed text to integer VND", () => {
    expect(parsePrice("35.000")).toBe(35000);
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
  });

  it("shows grouped thousands", () => {
    expect(formatPriceInput(35000)).toBe("35.000");
    expect(formatPriceInput(1250000)).toBe("1.250.000");
    expect(formatPriceInput(900)).toBe("900");
    expect(formatPriceInput(null)).toBe("");
  });

  it("validates the API bounds", () => {
    expect(priceError(null)).toBe("Nhập giá bán của món.");
    expect(priceError(999)).toBe("Giá tối thiểu 1.000 ₫.");
    expect(priceError(1000)).toBeUndefined();
    expect(priceError(10_000_000)).toBeUndefined();
    expect(priceError(10_000_001)).toBe("Giá tối đa 10.000.000 ₫.");
  });
});
