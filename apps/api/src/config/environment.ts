import "dotenv/config";

export interface ApiEnvironment {
  port: number;
}

export interface DatabaseEnvironment {
  connectionTimeoutMs: number;
  databaseUrl: string;
}

export function readApiEnvironment(
  environment: NodeJS.ProcessEnv
): ApiEnvironment {
  const port = Number(environment.PORT ?? 3001);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return { port };
}

export function readDatabaseEnvironment(
  environment: NodeJS.ProcessEnv
): DatabaseEnvironment {
  const databaseUrl = environment.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (
    !["postgres:", "postgresql:"].includes(parsedUrl.protocol) ||
    !parsedUrl.hostname ||
    !parsedUrl.pathname ||
    parsedUrl.pathname === "/"
  ) {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  const connectionTimeoutMs = Number(
    environment.DATABASE_CONNECT_TIMEOUT_MS ?? 3000
  );
  if (!Number.isInteger(connectionTimeoutMs) || connectionTimeoutMs < 1) {
    throw new Error("DATABASE_CONNECT_TIMEOUT_MS must be a positive integer.");
  }

  return { connectionTimeoutMs, databaseUrl };
}
