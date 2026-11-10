import type { MediaContentType } from "../../entities/media/media-asset.entity.js";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Identifies JPEG, PNG or WebP from the file's own bytes, never its name or header. */
export function detectImageType(bytes: Uint8Array): MediaContentType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));
  // PNG: signature, then the mandatory IHDR chunk first.
  if (
    bytes.length >= 16 &&
    png.every((byte, index) => bytes[index] === byte) &&
    ascii(12, 16) === "IHDR"
  )
    return "image/png";
  // WebP: RIFF container whose first chunk is VP8, VP8L or VP8X.
  if (
    bytes.length >= 16 &&
    ascii(0, 4) === "RIFF" &&
    ascii(8, 12) === "WEBP" &&
    ascii(12, 15) === "VP8"
  )
    return "image/webp";
  return null;
}
