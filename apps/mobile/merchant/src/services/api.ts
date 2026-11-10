import { sessionStore } from "./auth";
import { apiBaseUrl } from "./config";

/** A failed API call; `status` is the HTTP status or "network". */
export class ApiError extends Error {
  constructor(
    readonly status: number | "network",
    message: string
  ) {
    super(message);
  }
}

type Fetcher = typeof fetch;

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export const NETWORK_MESSAGE = "Không thể kết nối. Vui lòng thử lại.";

export function createApiRequest(
  baseUrl: string,
  readToken: () => Promise<string | null>,
  fetcher: Fetcher = (...args) => fetch(...args)
) {
  return async function request<T>(
    path: string,
    init: { method?: HttpMethod; body?: unknown } = {}
  ): Promise<T> {
    const token = await readToken();
    let response: Response;
    try {
      response = await fetcher(`${baseUrl}${path}`, {
        method: init.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(init.body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) })
      });
    } catch {
      throw new ApiError("network", NETWORK_MESSAGE);
    }
    const payload = (await response.json().catch(() => undefined)) as
      (T & { message?: unknown }) | undefined;
    if (!response.ok) {
      const message =
        typeof payload?.message === "string"
          ? payload.message
          : "Đã có lỗi xảy ra. Vui lòng thử lại.";
      throw new ApiError(response.status, message);
    }
    return payload as T;
  };
}

export const apiRequest = createApiRequest(apiBaseUrl, sessionStore.read);

/** The outcome of an API call, so screens can show the server's message. */
export type Outcome<T> =
  | { ok: true; value: T }
  | { ok: false; status: number | "network"; message: string };

export async function attempt<T>(task: () => Promise<T>): Promise<Outcome<T>> {
  try {
    return { ok: true, value: await task() };
  } catch (e) {
    if (e instanceof ApiError)
      return { ok: false, status: e.status, message: e.message };
    return { ok: false, status: "network", message: NETWORK_MESSAGE };
  }
}

/** Media URLs may be relative to the API (e.g. "/media/<id>"). */
export function resolveMediaUrl(
  url: string | null | undefined,
  baseUrl: string = apiBaseUrl
): string | undefined {
  if (!url) return undefined;
  return url.startsWith("/") ? `${baseUrl}${url}` : url;
}
