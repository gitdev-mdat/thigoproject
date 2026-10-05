import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { PostgresDataSourceOptions } from "typeorm/driver/postgres/PostgresDataSourceOptions.js";

import type { DatabaseEnvironment } from "./environment.js";

const runtimeRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function runtimeGlob(directory: string): string {
  return join(runtimeRoot, directory, "**", "*.{js,ts}").replaceAll("\\", "/");
}

export function createDatabaseOptions(
  environment: DatabaseEnvironment
): PostgresDataSourceOptions {
  return {
    type: "postgres",
    url: environment.databaseUrl,
    connectTimeoutMS: environment.connectionTimeoutMs,
    entities: [runtimeGlob("entities")],
    migrations: [runtimeGlob("migrations")],
    migrationsRun: false,
    migrationsTableName: "thigo_migrations",
    migrationsTransactionMode: "all",
    synchronize: false,
    logging: false,
    invalidWhereValuesBehavior: {
      null: "throw",
      undefined: "throw"
    }
  };
}
