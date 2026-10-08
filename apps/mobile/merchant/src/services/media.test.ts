import { describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({ sessionStore: { read: async () => null } }));
vi.mock("./config", () => ({ apiBaseUrl: "http://api.test" }));

const {
  UPLOAD_MESSAGES,
  createImageUploader,
  imageContentType,
  imageFilePart,
  precheckImage
} = await import("./media");

describe("picked image helpers", () => {
  it("derives the content type from the picker or the file name", () => {
    expect(
      imageContentType({ uri: "file:///a.jpg", mimeType: "image/PNG" })
    ).toBe("image/png");
    expect(imageContentType({ uri: "file:///x/photo.webp" })).toBe(
      "image/webp"
    );
    expect(imageContentType({ uri: "content://media/12" })).toBe("image/jpeg");
  });

  it("builds the React Native file part with a name and type", () => {
    expect(
      imageFilePart({ uri: "file:///x/IMG_1.png", mimeType: "image/png" })
    ).toEqual({
      uri: "file:///x/IMG_1.png",
      name: "image.png",
      type: "image/png"
    });
    expect(
      imageFilePart({
        uri: "file:///x/1",
        fileName: "mon.jpg",
        mimeType: "image/jpeg"
      })
    ).toMatchObject({ name: "mon.jpg" });
  });

  it("uses the web File when the picker provides one", () => {
    const file = new Blob(["x"], { type: "image/png" });
    expect(imageFilePart({ uri: "blob:1", file })).toBe(file);
  });

  it("rejects images the API would refuse", () => {
    expect(precheckImage({ uri: "a.jpg", fileSize: 6 * 1024 * 1024 })).toBe(
      UPLOAD_MESSAGES.tooLarge
    );
    expect(precheckImage({ uri: "a.heic", mimeType: "image/heic" })).toBe(
      UPLOAD_MESSAGES.wrongType
    );
    expect(precheckImage({ uri: "a.jpg", fileSize: 1000 })).toBeNull();
  });
});

describe("createImageUploader", () => {
  const image = { uri: "file:///a.jpg", mimeType: "image/jpeg" };

  it("posts multipart with the bearer token and no manual content type", async () => {
    const fetch = vi.fn(
      async (_url: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            id: "m1",
            url: "/media/m1",
            contentType: "image/jpeg",
            byteSize: 10
          }),
          { status: 201 }
        )
    );
    const upload = createImageUploader("http://api", async () => "tok", fetch);
    await expect(upload(image)).resolves.toMatchObject({ id: "m1" });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("http://api/merchant/media");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    expect(init?.headers).toMatchObject({ Authorization: "Bearer tok" });
    expect(init?.headers).not.toHaveProperty("Content-Type");
  });

  it("maps 413 and 415 to friendly Vietnamese", async () => {
    const respond = (status: number) =>
      createImageUploader(
        "http://api",
        async () => "tok",
        async () =>
          new Response(JSON.stringify({ message: "File too large" }), {
            status
          })
      );
    await expect(respond(413)(image)).rejects.toMatchObject({
      status: 413,
      message: UPLOAD_MESSAGES.tooLarge
    });
    await expect(respond(415)(image)).rejects.toMatchObject({
      status: 415,
      message: UPLOAD_MESSAGES.wrongType
    });
  });

  it("shows the server's message for other refusals, e.g. the upload quota", async () => {
    const upload = createImageUploader(
      "http://api",
      async () => "tok",
      async () =>
        new Response(
          JSON.stringify({ message: "Cửa hàng đã đạt giới hạn 300 ảnh." }),
          { status: 409 }
        )
    );
    await expect(upload(image)).rejects.toMatchObject({
      status: 409,
      message: "Cửa hàng đã đạt giới hạn 300 ảnh."
    });
  });

  it("reports a failed connection as a network upload error", async () => {
    const upload = createImageUploader(
      "http://api",
      async () => "tok",
      () => Promise.reject(new TypeError("offline"))
    );
    await expect(upload(image)).rejects.toMatchObject({
      status: "network",
      message: UPLOAD_MESSAGES.network
    });
  });
});
