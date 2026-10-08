import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
export const hashSecret = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");
export function verifySecret(value: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashSecret(value), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const createSessionToken = (): string =>
  randomBytes(32).toString("base64url");
