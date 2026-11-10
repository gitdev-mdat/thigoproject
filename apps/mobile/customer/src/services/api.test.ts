import { describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({
  apiBaseUrl: "http://api.test",
  sessionStore: { read: async () => null }
}));

const { ApiError, createApiRequest, resolveMediaUrl } = await import("./api");

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

    await request("/customer/orders", { method: "POST", body: { a: 1 } });

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("http://api/customer/orders");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer tok",
      "Content-Type": "application/json"
    });
    expect(init?.body).toBe('{"a":1}');
  });

  it("surfaces the server's Vietnamese message with the status", async () => {
    const request = createApiRequest(
      "http://api",
      async () => "tok",
      fetcher(409, { message: "Món đã hết." })
    );

    await expect(request("/x")).rejects.toMatchObject({
      status: 409,
      message: "Món đã hết."
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

describe("resolveMediaUrl", () => {
  it("prefixes API-relative media and keeps absolute URLs", () => {
    expect(resolveMediaUrl("/media/dev/pho.png")).toBe(
      "http://api.test/media/dev/pho.png"
    );
    expect(resolveMediaUrl("https://cdn.example/x.png")).toBe(
      "https://cdn.example/x.png"
    );
    expect(resolveMediaUrl(null)).toBeUndefined();
  });
});
