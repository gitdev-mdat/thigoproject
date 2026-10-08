import { useCallback, useEffect, useRef, useState } from "react";

import { customerHomeSource } from "../services/customerHome";
import type {
  CustomerHomeResponse,
  RecentOrder,
  RecommendationsResponse,
  SearchResponse,
  StoreCategory
} from "../types/home";

type Status = "loading" | "ready" | "error";

export function useCustomerHome() {
  const [status, setStatus] = useState<Status>("loading");
  const [home, setHome] = useState<CustomerHomeResponse>();
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [category, setCategory] = useState<StoreCategory>("food");
  const [recommendations, setRecommendations] =
    useState<RecommendationsResponse>();
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const latestCategory = useRef(category);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse>();
  const [searchStatus, setSearchStatus] = useState<Status>("ready");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [homeResponse, ordersResponse] = await Promise.all([
        customerHomeSource.getHome(),
        customerHomeSource.getRecentOrders()
      ]);
      setHome(homeResponse);
      setOrders(ordersResponse.orders);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  const loadRecommendations = useCallback(async (next: StoreCategory) => {
    latestCategory.current = next;
    setCategory(next);
    setRecommendationsLoading(true);
    try {
      const response = await customerHomeSource.getRecommendations(next);
      // Ignore answers for a category the user has already switched away from.
      if (latestCategory.current === next) setRecommendations(response);
    } catch {
      if (latestCategory.current === next) setRecommendations(undefined);
    } finally {
      if (latestCategory.current === next) setRecommendationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadRecommendations("food");
  }, [load, loadRecommendations]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults(undefined);
      setSearchStatus("ready");
      return;
    }
    setSearchStatus("loading");
    let cancelled = false;
    const timer = setTimeout(() => {
      customerHomeSource
        .search(trimmed)
        .then((response) => {
          if (cancelled) return;
          setSearchResults(response);
          setSearchStatus("ready");
        })
        .catch(() => {
          if (!cancelled) setSearchStatus("error");
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return {
    status,
    query,
    setQuery,
    searchResults,
    searchStatus,
    home,
    orders,
    category,
    recommendations,
    recommendationsLoading,
    selectCategory: loadRecommendations,
    reload: () => {
      void load();
      void loadRecommendations(latestCategory.current);
    }
  };
}

export type CustomerHome = ReturnType<typeof useCustomerHome>;
