import { describe, expect, it } from "vitest";
import { createSessionToken, hashSecret, verifySecret } from "./crypto.js";
describe("auth crypto", () => {
  it("hashes and timing-safely verifies secrets", () => {
    const hash = hashSecret("000000");
    expect(hash).not.toContain("000000");
    expect(verifySecret("000000", hash)).toBe(true);
    expect(verifySecret("111111", hash)).toBe(false);
  });
  it("creates unique opaque tokens", () =>
    expect(createSessionToken()).not.toBe(createSessionToken()));
});
