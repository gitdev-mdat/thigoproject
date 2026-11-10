import { describe, expect, it } from "vitest";
import { detectImageType } from "./image-validation.js";

const bytes = (...values: number[]) => Uint8Array.from(values);
const text = (value: string) => Uint8Array.from(Buffer.from(value, "latin1"));

describe("detectImageType", () => {
  it("recognises JPEG, PNG and WebP by their signatures", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))).toBe(
      "image/jpeg"
    );
    expect(
      detectImageType(
        Uint8Array.from([
          ...bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13),
          ...text("IHDR")
        ])
      )
    ).toBe("image/png");
    expect(detectImageType(text("RIFF\u0000\u0000\u0000\u0000WEBPVP8 "))).toBe(
      "image/webp"
    );
  });

  it("rejects other files even when they claim to be images", () => {
    expect(detectImageType(text("GIF89a......"))).toBeNull();
    expect(
      detectImageType(text("<svg xmlns='http://www.w3.org/2000/svg'>"))
    ).toBeNull();
    expect(detectImageType(text("%PDF-1.7"))).toBeNull();
    // A PNG signature followed by anything other than an IHDR chunk.
    expect(
      detectImageType(
        Uint8Array.from([
          ...bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
          ...text("not really")
        ])
      )
    ).toBeNull();
    expect(
      detectImageType(text("RIFF\u0000\u0000\u0000\u0000WEBPJUNK"))
    ).toBeNull();
    expect(detectImageType(bytes())).toBeNull();
    expect(detectImageType(bytes(0xff, 0xd8))).toBeNull();
  });
});
