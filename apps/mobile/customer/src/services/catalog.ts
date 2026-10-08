import type { CustomerHomeResponse } from "../types/orders";
import type {
  RecommendationsResponse,
  SearchResponse,
  StoreCategory,
  StoreDetail
} from "../types/catalog";
import { apiRequest } from "./api";

export const catalogApi = {
  home: () => apiRequest<CustomerHomeResponse>("/customer/home"),
  recommendations: (category: StoreCategory) =>
    apiRequest<RecommendationsResponse>(
      `/customer/recommendations?category=${category}`
    ),
  search: (query: string) =>
    apiRequest<SearchResponse>(
      `/customer/search?q=${encodeURIComponent(query)}`
    ),
  store: (id: string) =>
    apiRequest<StoreDetail>(`/customer/stores/${encodeURIComponent(id)}`)
};
