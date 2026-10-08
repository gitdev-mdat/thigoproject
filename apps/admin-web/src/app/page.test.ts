import { describe, expect, it } from "vitest";
import { createAuthClient } from "@thigo/auth-client";

describe("admin authentication", () => {
  it("uses the cookie session contract", async () => {
    let credentials: RequestCredentials | undefined;
    const fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      credentials = init?.credentials;
      return new Response(
        JSON.stringify({ id: "1", phone: "+84", roles: ["ADMIN"] }),
        { status: 200 }
      );
    };
    await createAuthClient({
      baseUrl: "http://api",
      mode: "cookie",
      fetch
    }).getCurrentUser();
    expect(credentials).toBe("include");
  });
});
