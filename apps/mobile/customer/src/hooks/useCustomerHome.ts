import { useCallback, useEffect, useRef, useState } from "react";

import { catalogApi } from "../services/catalog";
import { isActive } from "../utils/orderStatus";
import { usePolling } from "./usePolling";
import type { Address, OrderSummary } from "../types/orders";
import type {
  HomeShortcut,
  RecommendationsResponse,
  SearchResponse,
  StoreCategory
} from "../types/catalog";

type Status = "loading" | "ready" | "error";

const ORDER_POLL_MS = 5000;

/**
 * `visible` is true while the Home tab is on screen. Returning to it refreshes
 * the address and latest order, and an order still in progress is polled like
 * the order screen, so the "Đơn đang giao" card never keeps a finished status.
 */
export function useCustomerHome(visible = true) {
  const [status, setStatus] = useState<Status>("loading");
  const [shortcuts, setShortcuts] = useState<HomeShortcut[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  const [recentOrder, setRecentOrder] = useState<OrderSummary | null>(null);
  const [category, setCategory] = useState<StoreCategory>("FOOD");
  const [recommendations, setRecommendations] =
    useState<RecommendationsResponse>();
  const [recommendationsStatus, setRecommendationsStatus] =
    useState<Status>("loading");
  const latestCategory = useRef(category);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse>();
  const [searchStatus, setSearchStatus] = useState<Status>("ready");
  const [searchAttempt, setSearchAttempt] = useState(0);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setStatus("loading");
    try {
      const home = await catalogApi.home();
      setShortcuts(home.shortcuts);
      setAddress(home.defaultAddress);
      setRecentOrder(home.recentOrder);
      setStatus("ready");
    } catch {
      if (!quiet) setStatus("error");
    }
  }, []);

  const loadRecommendations = useCallback(async (next: StoreCategory) => {
    latestCategory.current = next;
    setCategory(next);
    setRecommendationsStatus("loading");
    try {
      const response = await catalogApi.recommendations(next);
      // Ignore answers for a category the user has already switched away from.
      if (latestCategory.current !== next) return;
      setRecommendations(response);
      setRecommendationsStatus("ready");
    } catch {
      if (latestCategory.current === next) setRecommendationsStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
    void loadRecommendations("FOOD");
  }, [load, loadRecommendations]);

  const shown = useRef(visible);
  useEffect(() => {
    if (visible && !shown.current) void load(true);
    shown.current = visible;
  }, [visible, load]);

  usePolling(
    () => void load(true),
    ORDER_POLL_MS,
    visible && recentOrder !== null && isActive(recentOrder.status)
  );

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
      catalogApi
        .search(trimmed)
        .then((response) => {
          if (cancelled) return;
          setSearchResults(response);
          setSearchStatus("ready");
        })
        .catch(() => {
          if (!cancelled) setSearchStatus("error");
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchAttempt]);

  return {
    status,
    shortcuts,
    address,
    setAddress,
    recentOrder,
    /** Refreshes address and latest order without showing placeholders. */
    refresh: () => void load(true),
    query,
    setQuery,
    searchResults,
    searchStatus,
    retrySearch: () => setSearchAttempt((value) => value + 1),
    category,
    recommendations:
      recommendations?.category === category ? recommendations : undefined,
    recommendationsStatus,
    selectCategory: loadRecommendations,
    reload: () => {
      void load();
      void loadRecommendations(latestCategory.current);
    }
  };
}

export type CustomerHome = ReturnType<typeof useCustomerHome>;
