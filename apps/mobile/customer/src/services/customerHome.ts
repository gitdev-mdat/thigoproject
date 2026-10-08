import type {
  CustomerHomeResponse,
  RecentOrdersResponse,
  RecommendationsResponse,
  SearchResponse,
  StoreCategory
} from "../types/home";
import { apiBaseUrl, sessionStore } from "./auth";
import { createMockCustomerHomeSource } from "./mock/customerHomeSource";

/** The Customer home's data contract; one method per endpoint. */
export type CustomerHomeSource = {
  /** GET /customer/home */
  getHome: () => Promise<CustomerHomeResponse>;
  /** GET /customer/recommendations?category= */
  getRecommendations: (
    category: StoreCategory
  ) => Promise<RecommendationsResponse>;
  /** GET /customer/recent-orders */
  getRecentOrders: () => Promise<RecentOrdersResponse>;
  /** GET /customer/search?q= */
  search: (query: string) => Promise<SearchResponse>;
};

export class CustomerHomeError extends Error {
  constructor(public readonly status: number | "network") {
    super(`customer home request failed: ${status}`);
    this.name = "CustomerHomeError";
  }
}

export function createHttpCustomerHomeSource(
  baseUrl: string,
  readToken: () => Promise<string | null>,
  fetcher: typeof globalThis.fetch = globalThis.fetch
): CustomerHomeSource {
  const get = async <T>(path: string): Promise<T> => {
    const token = await readToken();
    let response: Response;
    try {
      response = await fetcher(`${baseUrl.replace(/\/$/, "")}${path}`, {
        headers: token ? { authorization: `Bearer ${token}` } : {}
      });
    } catch {
      throw new CustomerHomeError("network");
    }
    if (!response.ok) throw new CustomerHomeError(response.status);
    return (await response.json()) as T;
  };
  return {
    getHome: () => get("/customer/home"),
    getRecommendations: (category) =>
      get(`/customer/recommendations?category=${category}`),
    getRecentOrders: () => get("/customer/recent-orders"),
    search: (query) => get(`/customer/search?q=${encodeURIComponent(query)}`)
  };
}

const isDev = (globalThis as { __DEV__?: boolean }).__DEV__ === true;

/**
 * The NestJS endpoints do not exist yet, so development builds read demo data
 * from the local mock source. Release builds always call the API and show the
 * error state until it ships, so demo data never reaches production.
 */
export const usesDemoData = isDev;

export const customerHomeSource: CustomerHomeSource = usesDemoData
  ? createMockCustomerHomeSource()
  : createHttpCustomerHomeSource(apiBaseUrl, sessionStore.read);
