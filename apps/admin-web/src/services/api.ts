import { createAuthClient } from "@thigo/auth-client";

import type {
  AdminDriverRow,
  AdminOrderRow,
  AdminOverview,
  AdminStoreRow,
  AdminUserRow,
  ApplicationDetail,
  ApplicationPage,
  Page,
  PartnerInput
} from "../types/admin";

export const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

/** The admin session lives in an httpOnly cookie; the browser never sees the token. */
export const authClient = createAuthClient({
  baseUrl: apiBaseUrl,
  mode: "cookie"
});

export type ApiErrorCode = "unauthorized" | "forbidden" | "invalid" | "failed";

export class AdminApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    /** The API's own Vietnamese message, when it sent one. */
    public readonly serverMessage?: string
  ) {
    super(code);
    this.name = "AdminApiError";
  }
}

type Query = Record<string, string | number | undefined>;

async function get<T>(path: string, query: Query = {}): Promise<T> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined && value !== "") search.set(key, String(value));
  const suffix = search.size ? `?${search}` : "";
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}${suffix}`, {
      credentials: "include",
      cache: "no-store"
    });
  } catch {
    throw new AdminApiError("failed");
  }
  if (response.status === 401) throw new AdminApiError("unauthorized");
  if (response.status === 403) throw new AdminApiError("forbidden");
  if (response.status === 400) throw new AdminApiError("invalid");
  if (!response.ok) throw new AdminApiError("failed");
  return (await response.json()) as T;
}

async function post<T>(path: string, body: unknown = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    throw new AdminApiError("failed");
  }
  if (response.ok) return (await response.json()) as T;
  const payload = (await response.json().catch(() => ({}))) as {
    message?: unknown;
  };
  const message =
    typeof payload.message === "string" ? payload.message : undefined;
  if (response.status === 401) throw new AdminApiError("unauthorized");
  if (response.status === 403) throw new AdminApiError("forbidden", message);
  if (response.status === 400 || response.status === 409)
    throw new AdminApiError("invalid", message);
  throw new AdminApiError("failed", message);
}

export const adminApi = {
  overview: () => get<AdminOverview>("/admin/overview"),
  orders: (query: Query) => get<Page<AdminOrderRow>>("/admin/orders", query),
  stores: (query: Query) => get<Page<AdminStoreRow>>("/admin/stores", query),
  users: (query: Query) => get<Page<AdminUserRow>>("/admin/users", query),
  drivers: (query: Query) => get<Page<AdminDriverRow>>("/admin/drivers", query),
  applications: (query: Query) =>
    get<ApplicationPage>("/admin/merchant-applications", query),
  application: (id: string) =>
    get<ApplicationDetail>(
      `/admin/merchant-applications/${encodeURIComponent(id)}`
    ),
  createPartner: (input: PartnerInput) =>
    post<ApplicationDetail>("/admin/merchant-applications", input),
  decide: (
    id: string,
    action: "approve" | "request-changes" | "reject",
    reason?: string
  ) =>
    post<ApplicationDetail>(
      `/admin/merchant-applications/${encodeURIComponent(id)}/${action}`,
      reason ? { reason } : {}
    )
};
