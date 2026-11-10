import "dotenv/config";

export interface ApiEnvironment {
  port: number;
}

export interface DatabaseEnvironment {
  connectionTimeoutMs: number;
  databaseUrl: string;
}

/** Explicit opt-in for pointing local development at a non-local database. */
export const REMOTE_DEVELOPMENT_DATABASE_FLAG =
  "THIGO_ALLOW_REMOTE_DEV_DATABASE";

const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

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

  if (
    environment.NODE_ENV === "development" &&
    !LOCAL_DATABASE_HOSTS.has(parsedUrl.hostname) &&
    environment[REMOTE_DEVELOPMENT_DATABASE_FLAG] !== "true"
  ) {
    throw new Error(
      `NODE_ENV=development expects the local Docker database (localhost). ` +
        `Set ${REMOTE_DEVELOPMENT_DATABASE_FLAG}=true to use a remote database on purpose.`
    );
  }

  const connectionTimeoutMs = Number(
    environment.DATABASE_CONNECT_TIMEOUT_MS ?? 3000
  );
  if (!Number.isInteger(connectionTimeoutMs) || connectionTimeoutMs < 1) {
    throw new Error("DATABASE_CONNECT_TIMEOUT_MS must be a positive integer.");
  }

  return { connectionTimeoutMs, databaseUrl };
}
