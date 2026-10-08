export type ApplicationRole = "CUSTOMER" | "MERCHANT" | "DRIVER" | "ADMIN";
export type AuthUser = { id: string; phone: string; roles: ApplicationRole[] };
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
  return {
    requestOtp: (phone: string, application: ApplicationRole) =>
      request<{ accepted: true }>("/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone, application })
      }),
    verifyOtp: (phone: string, otp: string, application: ApplicationRole) =>
      request<{ token?: string; user: AuthUser }>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, otp, application })
      }),
    getCurrentUser: (token?: string) =>
      request<AuthUser>("/auth/me", {}, token),
    checkAccess: (role: ApplicationRole, token?: string) =>
      request<{ allowed: true }>(`/auth/access/${role}`, {}, token),
    logout: (token?: string) =>
      request<{ loggedOut: true }>("/auth/logout", { method: "POST" }, token)
  };
}
