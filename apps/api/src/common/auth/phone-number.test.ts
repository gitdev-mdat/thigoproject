import { describe, expect, it } from "vitest";
import { canonicalizeVietnamesePhone } from "./phone-number.js";
describe("canonicalizeVietnamesePhone", () => {
  it.each([
    ["0901234567", "+84901234567"],
    ["+84901234567", "+84901234567"]
  ])("canonicalizes %s", (input, expected) =>
    expect(canonicalizeVietnamesePhone(input)).toBe(expected)
  );
  it.each(["", "84901234567", "+841234", "09012345678"])(
    "rejects %s",
    (input) => expect(() => canonicalizeVietnamesePhone(input)).toThrow()
  );
});
