import { describe, expect, it } from "vitest";

import { APP_NAME } from "./app-metadata";

describe("merchant app metadata", () => {
  it("identifies the deployment", () => {
    expect(APP_NAME).toBe("Merchant");
  });
});
