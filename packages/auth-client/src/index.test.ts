import { describe, expect, it, vi } from "vitest";
import { AuthError, createAuthClient } from "./index.js";

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
});
