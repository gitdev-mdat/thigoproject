import {
  DEVELOPMENT_FIXTURES_FLAG,
  developmentFixturesEnabled
} from "./development-fixtures.js";
export type OtpProviderMode = "test" | "disabled";
export interface AuthEnvironment {
  otpProvider: OtpProviderMode;
  otpExpirySeconds: number;
  otpAttemptLimit: number;
  otpResendSeconds: number;
  sessionExpirySeconds: number;
  adminCookieName: string;
  adminOrigin: string;
  secureCookie: boolean;
}
const positive = (
  value: string | undefined,
  fallback: number,
  name: string
): number => {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new Error(`${name} must be a positive integer.`);
  return parsed;
};
export function readAuthEnvironment(env: NodeJS.ProcessEnv): AuthEnvironment {
  const otpProvider = env.OTP_PROVIDER ?? "disabled";
  if (otpProvider !== "test" && otpProvider !== "disabled")
    throw new Error("OTP_PROVIDER must be test or disabled.");
  if (env.NODE_ENV === "production" && otpProvider === "test")
    throw new Error("OTP_PROVIDER=test is forbidden in production.");
  if (otpProvider === "test" && !developmentFixturesEnabled(env))
    throw new Error(
      `OTP_PROVIDER=test needs ${DEVELOPMENT_FIXTURES_FLAG}=true and NODE_ENV=development (or test).`
    );
  const adminOrigin = env.ADMIN_WEB_ORIGIN ?? "http://localhost:3000";
  const url = new URL(adminOrigin);
  if (!/^https?:$/.test(url.protocol) || url.origin !== adminOrigin)
    throw new Error("ADMIN_WEB_ORIGIN must be an HTTP origin.");
  return {
    otpProvider,
    otpExpirySeconds: positive(
      env.OTP_EXPIRY_SECONDS,
      300,
      "OTP_EXPIRY_SECONDS"
    ),
    otpAttemptLimit: positive(env.OTP_ATTEMPT_LIMIT, 5, "OTP_ATTEMPT_LIMIT"),
    otpResendSeconds: positive(
      env.OTP_RESEND_SECONDS,
      60,
      "OTP_RESEND_SECONDS"
    ),
    sessionExpirySeconds: positive(
      env.SESSION_EXPIRY_SECONDS,
      2592000,
      "SESSION_EXPIRY_SECONDS"
    ),
    adminCookieName: env.ADMIN_COOKIE_NAME?.trim() || "thigo_admin_session",
    adminOrigin,
    secureCookie: env.NODE_ENV === "production"
  };
}
