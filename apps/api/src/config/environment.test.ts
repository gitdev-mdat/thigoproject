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

  it.each(["not-a-url", "mysql://localhost/thigo", "postgresql://localhost"])(
    "rejects invalid database URL %s",
    (databaseUrl) => {
      expect(() =>
        readDatabaseEnvironment({ DATABASE_URL: databaseUrl })
      ).toThrow("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }
  );
});
