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
export const DEFAULT_API_TIMEOUT_MS = 15_000;

export function createApiRequest(
  baseUrl: string,
  readToken: () => Promise<string | null>,
  fetcher: Fetcher = (...args) => fetch(...args),
  timeoutMs = DEFAULT_API_TIMEOUT_MS
) {
  return async function request<T>(
    path: string,
    init: { method?: "GET" | "POST"; body?: unknown } = {}
  ): Promise<T> {
    const token = await readToken();
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(
          new ApiError("network", "Máy chủ chưa phản hồi. Vui lòng thử lại.")
        );
      }, timeoutMs);
    });
    try {
      const send = async (): Promise<T> => {
        const response = await fetcher(`${baseUrl}${path}`, {
          method: init.method ?? "GET",
          headers: {
            Accept: "application/json",
            ...(init.body === undefined
              ? {}
              : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          ...(init.body === undefined
            ? {}
            : { body: JSON.stringify(init.body) }),
          signal: controller.signal
        });
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
      return await Promise.race([send(), timeout]);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("network", "Không thể kết nối. Vui lòng thử lại.");
    } finally {
      clearTimeout(timer);
    }
  };
}

export const apiRequest = createApiRequest(apiBaseUrl, sessionStore.read);
