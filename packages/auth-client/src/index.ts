export type ApplicationRole = "CUSTOMER" | "MERCHANT" | "DRIVER" | "ADMIN";
/**
 * What a sign-in is for: an application role, or applying to become a
 * merchant (a session that proves the phone and grants no role).
 */
export type SignInPurpose = ApplicationRole | "MERCHANT_APPLICANT";
export type AuthUser = { id: string; phone: string; roles: ApplicationRole[] };
/** A seeded development account offered by the DEV quick login. */
export type QuickLoginAccount = { phone: string; label: string };
export type QuickLoginOffer = { otp: string; accounts: QuickLoginAccount[] };

export type AuthErrorCode =
  | "invalid"
  | "unauthorized"
  | "forbidden"
  | "cooldown"
  | "unavailable"
  | "network"
  | "timeout"
  | "unknown";

export class AuthError extends Error {
  constructor(public readonly code: AuthErrorCode) {
    super(code);
    this.name = "AuthError";
  }
}

type Options = {
  baseUrl: string;
  mode: "bearer" | "cookie";
  fetch?: typeof globalThis.fetch;
  /** Abort a request that has not answered in time. Defaults to 15 s. */
  timeoutMs?: number;
};

/**
 * React Native's Android HTTP client has no default timeout, so an unreachable
 * API host could otherwise leave a request (and the screen waiting on it) pending forever.
 */
export const DEFAULT_AUTH_TIMEOUT_MS = 15_000;

export function createAuthClient(options: Options) {
  const request = async <T>(
    path: string,
    init: RequestInit = {},
    token?: string
  ): Promise<T> => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Rejects even if a fetch implementation ignores the abort signal.
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new AuthError("timeout"));
      }, options.timeoutMs ?? DEFAULT_AUTH_TIMEOUT_MS);
    });
    const send = async (): Promise<T> => {
      const response = await (options.fetch ?? globalThis.fetch)(
        `${options.baseUrl.replace(/\/$/, "")}${path}`,
        {
          ...init,
          ...(options.mode === "cookie"
            ? { credentials: "include" as const }
            : {}),
          headers: {
            ...(init.body ? { "content-type": "application/json" } : {}),
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...init.headers
          },
          signal: controller.signal
        }
      );
      if (!response.ok) {
        const code: AuthErrorCode =
          response.status === 401
            ? "unauthorized"
            : response.status === 403
              ? "forbidden"
              : response.status === 429
                ? "cooldown"
                : response.status === 400
                  ? "invalid"
                  : response.status === 503
                    ? "unavailable"
                    : "unknown";
        throw new AuthError(code);
      }
      return (await response.json()) as T;
    };
    try {
      return await Promise.race([send(), timeout]);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      if (controller.signal.aborted) throw new AuthError("timeout");
      throw new AuthError("network");
    } finally {
      clearTimeout(timer);
    }
  };
  const requestOtp = (phone: string, application: SignInPurpose) =>
    request<{ accepted: true }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ phone, application })
    });
  const verifyOtp = (phone: string, otp: string, application: SignInPurpose) =>
    request<{ token?: string; user: AuthUser }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp, application })
    });
  return {
    /**
     * Seeded accounts for the DEV quick login, or null when the API does not
     * offer it (anything other than local development with fixtures on).
     */
    getQuickLoginOffer: async (
      application: ApplicationRole
    ): Promise<QuickLoginOffer | null> => {
      try {
        return await request<QuickLoginOffer>(
          `/auth/dev/quick-login?application=${application}`
        );
      } catch {
        return null;
      }
    },
    /**
     * Signs in a quick login account through the normal OTP endpoints. A code
     * may already be pending from an earlier tap, so a refused request still
     * tries to verify; the server decides whether the account may enter.
     */
    quickLogin: async (
      account: QuickLoginAccount,
      offer: QuickLoginOffer,
      application: ApplicationRole
    ) => {
      try {
        await requestOtp(account.phone, application);
      } catch (error) {
        if (!(error instanceof AuthError) || error.code !== "invalid")
          throw error;
      }
      return verifyOtp(account.phone, offer.otp, application);
    },
    requestOtp,
    verifyOtp,
    getCurrentUser: (token?: string) =>
      request<AuthUser>("/auth/me", {}, token),
    checkAccess: (role: ApplicationRole, token?: string) =>
      request<{ allowed: true }>(`/auth/access/${role}`, {}, token),
    logout: (token?: string) =>
      request<{ loggedOut: true }>("/auth/logout", { method: "POST" }, token)
  };
}
