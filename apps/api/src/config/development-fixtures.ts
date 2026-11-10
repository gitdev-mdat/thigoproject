/** Opt-in switch for seeds, the fixed test OTP and seeded demo images. */
export const DEVELOPMENT_FIXTURES_FLAG = "THIGO_ENABLE_DEV_FIXTURES";

/** Runtimes where fixtures may run; anything else, including unset, is refused. */
const APPROVED_RUNTIMES = new Set(["development", "test"]);

/**
 * Development fixtures are on only when the flag is exactly "true" and
 * NODE_ENV names an approved non-production runtime. Unset or unknown
 * settings leave them off; production with the flag on is a startup error.
 */
export function developmentFixturesEnabled(env: NodeJS.ProcessEnv): boolean {
  const flag = env[DEVELOPMENT_FIXTURES_FLAG];
  if (flag === undefined || flag === "" || flag === "false") return false;
  if (flag !== "true")
    throw new Error(`${DEVELOPMENT_FIXTURES_FLAG} must be true or false.`);
  if (env.NODE_ENV === "production")
    throw new Error(
      `${DEVELOPMENT_FIXTURES_FLAG}=true is forbidden in production.`
    );
  return APPROVED_RUNTIMES.has(env.NODE_ENV ?? "");
}

export function assertDevelopmentFixturesEnabled(
  env: NodeJS.ProcessEnv,
  operation: string
): void {
  if (!developmentFixturesEnabled(env))
    throw new Error(
      `${operation} needs ${DEVELOPMENT_FIXTURES_FLAG}=true and NODE_ENV=development (or test).`
    );
}
