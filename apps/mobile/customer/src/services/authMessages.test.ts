import { describe, expect, it } from "vitest";
import { AuthError } from "@thigo/auth-client";

import { restoreFailureKind } from "./authMessages";

describe("restoreFailureKind", () => {
  it.each(["network", "timeout"] as const)(
    "classifies %s as a connectivity failure",
    (code) => {
      expect(restoreFailureKind(new AuthError(code))).toBe("network");
    }
  );

  it.each(["unknown", "unavailable"] as const)(
    "classifies %s as a server failure",
    (code) => {
      expect(restoreFailureKind(new AuthError(code))).toBe("server");
    }
  );

  it("classifies unexpected errors as server failures", () => {
    expect(restoreFailureKind(new Error("boom"))).toBe("server");
  });
});
