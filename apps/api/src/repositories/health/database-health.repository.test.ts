import { Logger } from "@nestjs/common";
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

  it("logs the pending migrations once the database connects", async () => {
    const error = vi
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
    let initialized = false;
    const dataSource = dataSourceStub({
      get isInitialized() {
        return initialized;
      },
      initialize: vi.fn(async () => {
        initialized = true;
        return dataSource;
      }),
      options: { migrationsTableName: "thigo_migrations" },
      migrations: [
        { name: "CreateIdentityAndAccess1760000000000" },
        { name: "CreateCatalog1760100000000" }
      ],
      query: vi.fn(async (sql: string) =>
        sql.includes("to_regclass")
          ? [{ present: true }]
          : sql.includes("thigo_migrations")
            ? [{ name: "CreateIdentityAndAccess1760000000000" }]
            : [{ result: 1 }]
      )
    } as unknown as Partial<DataSource>);

    await expect(
      new DatabaseHealthRepository(dataSource).getStatus()
    ).resolves.toBe("up");
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining(
        "1 migration(s) not applied (CreateCatalog1760100000000)"
      )
    );
    error.mockRestore();
  });

  it("stays up when the migration history cannot be read", async () => {
    const warn = vi
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => undefined);
    let initialized = false;
    const dataSource = dataSourceStub({
      get isInitialized() {
        return initialized;
      },
      initialize: vi.fn(async () => {
        initialized = true;
        return dataSource;
      }),
      options: {},
      migrations: [],
      query: vi.fn(async (sql: string) => {
        if (sql.includes("to_regclass")) throw new Error("permission denied");
        return [{ result: 1 }];
      })
    } as unknown as Partial<DataSource>);

    await expect(
      new DatabaseHealthRepository(dataSource).getStatus()
    ).resolves.toBe("up");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("permission denied")
    );
    warn.mockRestore();
  });
});
