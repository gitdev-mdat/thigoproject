import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthError,
  DEFAULT_AUTH_TIMEOUT_MS,
  createAuthClient
} from "./index.js";

describe("auth client", () => {
  it("sends the role and bearer token", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ allowed: true }), { status: 200 })
      );
    const client = createAuthClient({
      baseUrl: "http://api/",
      mode: "bearer",
      fetch
    });
    await client.checkAccess("DRIVER", "secret");
    expect(fetch).toHaveBeenCalledWith(
      "http://api/auth/access/DRIVER",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer secret" })
      })
    );
  });
  it("uses credentials without exposing an admin token", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ user: { id: "1", phone: "+84", roles: ["ADMIN"] } }),
          { status: 200 }
        )
      );
    const result = await createAuthClient({
      baseUrl: "http://api",
      mode: "cookie",
      fetch
    }).verifyOtp("0900000000", "000000", "ADMIN");
    expect(result.token).toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      "http://api/auth/otp/verify",
      expect.objectContaining({ credentials: "include" })
    );
  });
  it("classifies failures without returning API bodies", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: "private" }), { status: 403 })
      );
    await expect(
      createAuthClient({
        baseUrl: "http://api",
        mode: "bearer",
        fetch
      }).getCurrentUser()
    ).rejects.toEqual(new AuthError("forbidden"));
  });
  it("distinguishes an unavailable auth service from a network failure", async () => {
    const unavailableFetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));
    await expect(
      createAuthClient({
        baseUrl: "http://api",
        mode: "bearer",
        fetch: unavailableFetch
      }).requestOtp("0900000000", "CUSTOMER")
    ).rejects.toEqual(new AuthError("unavailable"));

    const networkFetch = vi
      .fn()
      .mockRejectedValue(new TypeError("fetch failed"));
    await expect(
      createAuthClient({
        baseUrl: "http://api",
        mode: "bearer",
        fetch: networkFetch
      }).requestOtp("0900000000", "CUSTOMER")
    ).rejects.toEqual(new AuthError("network"));
  });

  describe("timeout", () => {
    afterEach(() => {
      vi.useRealTimers();
    });
    /** A request that never answers until it is aborted, like an unreachable host. */
    const hangingFetch = () =>
      vi.fn(
        (_url: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_, reject) =>
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError"))
            )
          )
      );

    it("aborts a request that does not answer within the default timeout", async () => {
      vi.useFakeTimers();
      const fetch = hangingFetch();
      const pending = createAuthClient({
        baseUrl: "http://api",
        mode: "bearer",
        fetch
      }).requestOtp("0900000000", "CUSTOMER");
      const outcome = expect(pending).rejects.toEqual(new AuthError("timeout"));
      await vi.advanceTimersByTimeAsync(DEFAULT_AUTH_TIMEOUT_MS - 1);
      expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await outcome;
      expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    });

    it("times out even if the fetch implementation ignores the abort signal", async () => {
      vi.useFakeTimers();
      const fetch = vi.fn(() => new Promise<Response>(() => undefined));
      const pending = createAuthClient({
        baseUrl: "http://api",
        mode: "bearer",
        fetch,
        timeoutMs: 1_000
      }).getCurrentUser("tok");
      const outcome = expect(pending).rejects.toEqual(new AuthError("timeout"));
      await vi.advanceTimersByTimeAsync(1_000);
      await outcome;
    });

    it("clears the timer once the API answers", async () => {
      vi.useFakeTimers();
      const fetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ accepted: true }), { status: 200 })
        );
      await createAuthClient({
        baseUrl: "http://api",
        mode: "bearer",
        fetch
      }).requestOtp("0900000000", "CUSTOMER");
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
