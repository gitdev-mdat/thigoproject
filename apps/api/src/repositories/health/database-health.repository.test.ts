import type { DataSource } from "typeorm";
import { describe, expect, it, vi } from "vitest";

import { DatabaseHealthRepository } from "./database-health.repository.js";

function dataSourceStub(overrides: Partial<DataSource> = {}): DataSource {
  return {
    destroy: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    isInitialized: true,
    query: vi.fn().mockResolvedValue([{ result: 1 }]),
    ...overrides
  } as unknown as DataSource;
}

describe("DatabaseHealthRepository", () => {
  it("reports an initialized, queryable database as up", async () => {
    const repository = new DatabaseHealthRepository(dataSourceStub());

    await expect(repository.getStatus()).resolves.toBe("up");
  });

  it("reports a failed query as down", async () => {
    const repository = new DatabaseHealthRepository(
      dataSourceStub({
        query: vi.fn().mockRejectedValue(new Error("unavailable"))
      })
    );

    await expect(repository.getStatus()).resolves.toBe("down");
  });

  it("reports failed initialization as down without exposing the error", async () => {
    const repository = new DatabaseHealthRepository(
      dataSourceStub({
        isInitialized: false,
        initialize: vi
          .fn()
          .mockRejectedValue(new Error("secret connection detail"))
      })
    );

    await expect(repository.getStatus()).resolves.toBe("down");
  });
});
