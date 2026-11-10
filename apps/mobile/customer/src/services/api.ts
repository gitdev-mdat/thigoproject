import { apiBaseUrl, sessionStore } from "./auth";

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

export function createApiRequest(
  baseUrl: string,
  readToken: () => Promise<string | null>,
  fetcher: Fetcher = (...args) => fetch(...args)
) {
  return async function request<T>(
    path: string,
    init: { method?: "GET" | "POST" | "DELETE"; body?: unknown } = {}
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
      throw new ApiError("network", "Không thể kết nối. Vui lòng thử lại.");
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

/** Catalog images may be API-relative (development media) or absolute. */
export function resolveMediaUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith("/") ? `${apiBaseUrl}${url}` : url;
}
