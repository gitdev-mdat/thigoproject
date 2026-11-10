import { useCallback, useEffect, useState } from "react";

import { ordersApi } from "../services/orders";
import type { OrderSummary } from "../types/orders";
import { isActive } from "../utils/orderStatus";
import { usePolling } from "./usePolling";

export function useOrders() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setStatus("loading");
    try {
      setOrders((await ordersApi.list()).orders);
      setStatus("ready");
    } catch {
      if (!quiet) setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  usePolling(
    () => void load(true),
    10000,
    orders.some((order) => isActive(order.status))
  );

  return { status, orders, reload: load };
}
