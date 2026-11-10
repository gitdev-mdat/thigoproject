import { describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({ sessionStore: { read: async () => null } }));
vi.mock("./config", () => ({ apiBaseUrl: "http://api.test" }));

const { ApiError, createApiRequest } = await import("./api");

function fetcher(status: number, body: unknown) {
  return vi.fn(
    async (_url: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(body), { status })
  );
}

describe("createApiRequest", () => {
  it("sends the bearer token and JSON body", async () => {
    const fetch = fetcher(200, { ok: true });
    const request = createApiRequest("http://api", async () => "tok", fetch);

    await request("/merchant/orders/1/reject", {
      method: "POST",
      body: { reason: "Hết món" }
    });

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("http://api/merchant/orders/1/reject");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer tok",
      "Content-Type": "application/json"
    });
    expect(init?.body).toBe('{"reason":"Hết món"}');
  });

  it("omits the JSON content type when there is no body", async () => {
    const fetch = fetcher(200, {});
    const request = createApiRequest("http://api", async () => "tok", fetch);

    await request("/merchant/orders/1/accept", { method: "POST" });

    const [, init] = fetch.mock.calls[0]!;
    expect(init?.headers).not.toHaveProperty("Content-Type");
    expect(init?.body).toBeUndefined();
  });

  it("surfaces the server's Vietnamese message with the status", async () => {
    const request = createApiRequest(
      "http://api",
      async () => "tok",
      fetcher(409, { message: "Khách đã huỷ đơn này." })
    );

    await expect(request("/x")).rejects.toMatchObject({
      status: 409,
      message: "Khách đã huỷ đơn này."
    });
  });

  it("maps a failed connection to a network error", async () => {
    const request = createApiRequest(
      "http://api",
      async () => null,
      () => Promise.reject(new TypeError("offline"))
    );

    await expect(request("/x")).rejects.toBeInstanceOf(ApiError);
    await expect(request("/x")).rejects.toMatchObject({ status: "network" });
  });
});

describe("attempt", () => {
  it("wraps success and API failures without throwing", async () => {
    const { attempt } = await import("./api");
    await expect(attempt(async () => 3)).resolves.toEqual({
      ok: true,
      value: 3
    });
    await expect(
      attempt(async () => {
        throw new ApiError(409, "Danh mục vẫn còn món.");
      })
    ).resolves.toEqual({
      ok: false,
      status: 409,
      message: "Danh mục vẫn còn món."
    });
    await expect(
      attempt(async () => {
        throw new Error("boom");
      })
    ).resolves.toMatchObject({ ok: false, status: "network" });
  });
});

describe("resolveMediaUrl", () => {
  it("resolves API-relative media against the API origin", async () => {
    const { resolveMediaUrl } = await import("./api");
    expect(resolveMediaUrl("/media/dev/a.png")).toBe(
      "http://api.test/media/dev/a.png"
    );
    expect(resolveMediaUrl("https://cdn.test/a.png")).toBe(
      "https://cdn.test/a.png"
    );
    expect(resolveMediaUrl(null)).toBeUndefined();
  });
});
