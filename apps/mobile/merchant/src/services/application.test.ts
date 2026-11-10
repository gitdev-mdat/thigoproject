import { describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({ sessionStore: { read: async () => "tok" } }));
vi.mock("./config", () => ({ apiBaseUrl: "http://api.test" }));

import { privateImageSource, toBase64 } from "./application";

describe("toBase64", () => {
  it.each([
    ["", ""],
    ["f", "Zg=="],
    ["fo", "Zm8="],
    ["foo", "Zm9v"],
    ["foob", "Zm9vYg=="],
    ["fooba", "Zm9vYmE="],
    ["foobar", "Zm9vYmFy"]
  ])("encodes %j as %j", (text, encoded) => {
    expect(toBase64(new TextEncoder().encode(text))).toBe(encoded);
  });
});

describe("privateImageSource", () => {
  it("fetches the image with the session and returns a data URI", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": "image/png" }
        })
    );
    await expect(
      privateImageSource("/merchant-applications/me/media/x", fetcher)
    ).resolves.toEqual({ uri: "data:image/png;base64,AQID" });
    expect(fetcher).toHaveBeenCalledWith(
      "http://api.test/merchant-applications/me/media/x",
      { headers: { Authorization: "Bearer tok" } }
    );
  });

  it("returns nothing when the image is refused", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 404 }));
    await expect(
      privateImageSource("/merchant-applications/me/media/x", fetcher)
    ).resolves.toBeUndefined();
  });
});
