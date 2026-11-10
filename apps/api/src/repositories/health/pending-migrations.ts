import type { DataSource } from "typeorm";

/** Migrations this build knows about that the connected database has not applied. */
export async function findPendingMigrations(
  dataSource: DataSource
): Promise<string[]> {
  const table = dataSource.options.migrationsTableName ?? "migrations";
  const [{ present }] = (await dataSource.query(
    "SELECT to_regclass($1) IS NOT NULL AS present",
    [table]
  )) as [{ present: boolean }];
  const applied = new Set<string>(
    present
      ? (
          (await dataSource.query(`SELECT name FROM "${table}"`)) as {
            name: string;
          }[]
        ).map((row) => row.name)
      : []
  );
  return dataSource.migrations
    .map((migration) => migration.name ?? migration.constructor.name)
    .filter((name) => !applied.has(name));
}

export function pendingMigrationsMessage(
  pending: string[],
  then = "restart the API"
): string {
  return `Database schema is behind this API: ${pending.length} migration(s) not applied (${pending.join(", ")}). Run "pnpm db:migrate" from the repository root, then ${then}.`;
}

/** Stops a script before it queries tables that do not exist yet. */
export async function assertNoPendingMigrations(
  dataSource: DataSource
): Promise<void> {
  const pending = await findPendingMigrations(dataSource);
  if (pending.length)
    throw new Error(
      pendingMigrationsMessage(pending, 'run "pnpm dev:seed" again')
    );
}
