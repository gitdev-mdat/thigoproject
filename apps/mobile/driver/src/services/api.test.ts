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
  it("sends the bearer token", async () => {
    const fetch = fetcher(200, { ok: true });
    const request = createApiRequest("http://api", async () => "tok", fetch);

    await request("/driver/deliveries/1/claim", { method: "POST" });

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("http://api/driver/deliveries/1/claim");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer tok" });
    expect(init?.body).toBeUndefined();
  });

  it("surfaces the server's Vietnamese message with the status", async () => {
    const request = createApiRequest(
      "http://api",
      async () => "tok",
      fetcher(409, { message: "Đơn này đã có tài xế khác nhận." })
    );

    await expect(request("/x")).rejects.toMatchObject({
      status: 409,
      message: "Đơn này đã có tài xế khác nhận."
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
