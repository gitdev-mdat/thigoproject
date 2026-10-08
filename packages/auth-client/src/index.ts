export type ApplicationRole = "CUSTOMER" | "MERCHANT" | "DRIVER" | "ADMIN";
export type AuthUser = { id: string; phone: string; roles: ApplicationRole[] };
export type AuthErrorCode =
  | "invalid"
  | "unauthorized"
  | "forbidden"
  | "cooldown"
  | "unavailable"
  | "network"
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
};

export function createAuthClient(options: Options) {
  const request = async <T>(
    path: string,
    init: RequestInit = {},
    token?: string
  ): Promise<T> => {
    try {
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
          }
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
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("network");
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
