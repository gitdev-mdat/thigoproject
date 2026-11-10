import type { DataSource } from "typeorm";
import { describe, expect, it, vi } from "vitest";

import {
  assertNoPendingMigrations,
  findPendingMigrations
} from "./pending-migrations.js";

const MIGRATIONS = [
  "CreateIdentityAndAccess1760000000000",
  "CreateCatalog1760100000000",
  "CreateOrdering1760200000000"
];

function dataSourceStub(applied: string[] | null): DataSource {
  const query = vi.fn(async (sql: string) =>
    sql.includes("to_regclass")
      ? [{ present: applied !== null }]
      : (applied ?? []).map((name) => ({ name }))
  );
  return {
    options: { migrationsTableName: "thigo_migrations" },
    migrations: MIGRATIONS.map((name) => ({ name })),
    query
  } as unknown as DataSource;
}

describe("findPendingMigrations", () => {
  it("lists migrations a database at the F01 schema has not applied", async () => {
    await expect(
      findPendingMigrations(dataSourceStub(MIGRATIONS.slice(0, 1)))
    ).resolves.toEqual(MIGRATIONS.slice(1));
  });

  it("treats a database without a migration table as having none applied", async () => {
    await expect(findPendingMigrations(dataSourceStub(null))).resolves.toEqual(
      MIGRATIONS
    );
  });

  it("reports nothing once every migration is applied", async () => {
    await expect(
      findPendingMigrations(dataSourceStub(MIGRATIONS))
    ).resolves.toEqual([]);
  });
});

describe("assertNoPendingMigrations", () => {
  it("names the missing migrations and the command that applies them", async () => {
    await expect(
      assertNoPendingMigrations(dataSourceStub(MIGRATIONS.slice(0, 1)))
    ).rejects.toThrow(
      /2 migration\(s\) not applied \(CreateCatalog1760100000000, CreateOrdering1760200000000\)\. Run "pnpm db:migrate" from the repository root, then run "pnpm dev:seed" again/
    );
  });

  it("passes an up-to-date database", async () => {
    await expect(
      assertNoPendingMigrations(dataSourceStub(MIGRATIONS))
    ).resolves.toBeUndefined();
  });
});
