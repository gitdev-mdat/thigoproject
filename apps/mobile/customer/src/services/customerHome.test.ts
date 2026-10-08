import { describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({
  apiBaseUrl: "http://api.test",
  sessionStore: { read: async () => "token-1" }
}));

const { createHttpCustomerHomeSource, CustomerHomeError } =
  await import("./customerHome");
const { createMockCustomerHomeSource } =
  await import("./mock/customerHomeSource");

describe("mock customer home source", () => {
  const source = createMockCustomerHomeSource(0);

  it("keeps the four primary intents and no promotion among them", async () => {
    const home = await source.getHome();
    expect(home.shortcuts.map((s) => s.label)).toEqual([
      "Đồ ăn",
      "Cà phê",
      "Trà sữa",
      "Đơn gần đây"
    ]);
  });

  it("filters recommendations by category", async () => {
    const coffee = await source.getRecommendations("coffee");
    expect(coffee.stores.length).toBeGreaterThan(0);
    expect(coffee.stores.every((s) => s.category === "coffee")).toBe(true);
    expect(coffee.dishes.every((d) => d.category === "coffee")).toBe(true);
  });

  it("searches names and tags without needing diacritics", async () => {
    const result = await source.search("tra sua");
    expect(result.stores.map((s) => s.name)).toContain("Trà Sữa Mây");
    expect(result.dishes.map((d) => d.name)).toContain("Trà sữa trân châu");
    expect((await source.search("pizza")).stores).toEqual([]);
  });

  it("stores prices as integer VND", async () => {
    const all = await Promise.all(
      (["food", "coffee", "milk_tea"] as const).map((c) =>
        source.getRecommendations(c)
      )
    );
    const orders = await source.getRecentOrders();
    const amounts = [
      ...all.flatMap((r) => r.dishes.map((d) => d.price)),
      ...orders.orders.map((o) => o.total)
    ];
    expect(amounts.every(Number.isInteger)).toBe(true);
  });
});

describe("http customer home source", () => {
  it("calls the planned endpoints with the session token", async () => {
    const fetcher = vi.fn(
      async (_url: RequestInfo | URL, _init?: RequestInit) =>
        new Response("{}", { status: 200 })
    );
    const source = createHttpCustomerHomeSource(
      "http://api.test/",
      async () => "token-1",
      fetcher
    );
    await source.getHome();
    await source.getRecommendations("milk_tea");
    await source.getRecentOrders();
    await source.search("trà sữa");
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual([
      "http://api.test/customer/home",
      "http://api.test/customer/recommendations?category=milk_tea",
      "http://api.test/customer/recent-orders",
      "http://api.test/customer/search?q=tr%C3%A0%20s%E1%BB%AFa"
    ]);
    expect(fetcher.mock.calls[0]?.[1]).toEqual({
      headers: { authorization: "Bearer token-1" }
    });
  });

  it("reports HTTP and network failures", async () => {
    const notFound = createHttpCustomerHomeSource(
      "http://api.test",
      async () => null,
      async () => new Response("", { status: 404 })
    );
    await expect(notFound.getHome()).rejects.toEqual(
      new CustomerHomeError(404)
    );
    const offline = createHttpCustomerHomeSource(
      "http://api.test",
      async () => null,
      async () => {
        throw new TypeError("offline");
      }
    );
    await expect(offline.getHome()).rejects.toBeInstanceOf(CustomerHomeError);
  });
});
