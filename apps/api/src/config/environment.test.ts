import { describe, expect, it } from "vitest";

import { readApiEnvironment, readDatabaseEnvironment } from "./environment.js";

describe("readApiEnvironment", () => {
  it("uses the documented default port", () => {
    expect(readApiEnvironment({})).toEqual({ port: 3001 });
  });

  it("rejects an invalid port", () => {
    expect(() => readApiEnvironment({ PORT: "invalid" })).toThrow(
      "PORT must be an integer"
    );
  });
});

describe("readDatabaseEnvironment", () => {
  it("accepts a PostgreSQL URL without exposing or changing it", () => {
    const databaseUrl = "postgresql://thigo:secret@localhost:5432/thigo";

    expect(readDatabaseEnvironment({ DATABASE_URL: databaseUrl })).toEqual({
      connectionTimeoutMs: 3000,
      databaseUrl
    });
  });

  it("requires DATABASE_URL", () => {
    expect(() => readDatabaseEnvironment({})).toThrow(
      "DATABASE_URL is required."
    );
  });

  it.each([
    "postgresql://thigo:secret@localhost:5432/thigo",
    "postgresql://thigo:secret@127.0.0.1:5432/thigo",
    "postgresql://thigo:secret@[::1]:5432/thigo"
  ])("accepts the local database %s in development", (databaseUrl) => {
    expect(
      readDatabaseEnvironment({
        DATABASE_URL: databaseUrl,
        NODE_ENV: "development"
      }).databaseUrl
    ).toBe(databaseUrl);
  });

  it("refuses a remote database in development without exposing the URL", () => {
    const databaseUrl =
      "postgresql://user:secret@db.example.supabase.com:5432/postgres";

    expect(() =>
      readDatabaseEnvironment({
        DATABASE_URL: databaseUrl,
        NODE_ENV: "development"
      })
    ).toThrow(/^(?!.*secret).*THIGO_ALLOW_REMOTE_DEV_DATABASE=true/);
  });

  it.each([undefined, "", "false", "1", "TRUE"])(
    "keeps refusing a remote development database when the opt-in is %s",
    (flag) => {
      expect(() =>
        readDatabaseEnvironment({
          DATABASE_URL: "postgresql://user:secret@db.example.com/postgres",
          NODE_ENV: "development",
          THIGO_ALLOW_REMOTE_DEV_DATABASE: flag
        })
      ).toThrow("NODE_ENV=development expects the local Docker database");
    }
  );

  it("allows a remote development database only with the explicit opt-in", () => {
    const databaseUrl = "postgresql://user:secret@db.example.com/postgres";

    expect(
      readDatabaseEnvironment({
        DATABASE_URL: databaseUrl,
        NODE_ENV: "development",
        THIGO_ALLOW_REMOTE_DEV_DATABASE: "true"
      }).databaseUrl
    ).toBe(databaseUrl);
  });

  it.each(["production", "test", undefined])(
    "leaves remote databases to other runtimes (NODE_ENV=%s)",
    (nodeEnv) => {
      const databaseUrl = "postgresql://user:secret@db.example.com/postgres";

      expect(
        readDatabaseEnvironment({
          DATABASE_URL: databaseUrl,
          NODE_ENV: nodeEnv
        }).databaseUrl
      ).toBe(databaseUrl);
    }
  );

  it.each(["not-a-url", "mysql://localhost/thigo", "postgresql://localhost"])(
    "rejects invalid database URL %s",
    (databaseUrl) => {
      expect(() =>
        readDatabaseEnvironment({ DATABASE_URL: databaseUrl })
      ).toThrow("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }
  );
});
