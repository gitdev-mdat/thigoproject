import { describe, expect, it } from "vitest";

import { createDatabaseOptions } from "./database.js";

describe("createDatabaseOptions", () => {
  it("keeps schema mutation and automatic migrations disabled", () => {
    const options = createDatabaseOptions({
      connectionTimeoutMs: 2500,
      databaseUrl: "postgresql://thigo:secret@localhost:5432/thigo"
    });

    expect(options).toMatchObject({
      type: "postgres",
      connectTimeoutMS: 2500,
      migrationsRun: false,
      migrationsTableName: "thigo_migrations",
      synchronize: false,
      logging: false
    });
  });
});
