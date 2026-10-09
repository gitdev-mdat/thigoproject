import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "../services/api";
import { deliveriesApi, type DeliveryAction } from "../services/deliveries";
import type { Delivery, DeliveryOverview } from "../types/delivery";
import { usePolling } from "./usePolling";

/** No push channel yet; poll while the app is in the foreground. */
const POLL_MS = 5000;
const NOTICE_MS = 8000;
const SUCCESS_MS = 5000;

export type PendingAction = { id: string; action: DeliveryAction };

const message = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

export function useDeliveries() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [overview, setOverview] = useState<DeliveryOverview>();
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date>();
  const [stale, setStale] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState<PendingAction>();
  const [notice, setNotice] = useState("");
  const [delivered, setDelivered] = useState<Delivery>();
  const acting = useRef(false);
  // Bumped around every action so an older poll cannot overwrite its result.
  const generation = useRef(0);

  const load = useCallback(async (quiet = false) => {
    if (quiet && acting.current) return;
    const started = generation.current;
    if (!quiet) setStatus("loading");
    try {
      const data = await deliveriesApi.overview();
      if (started !== generation.current) return;
      setOverview(data);
      setUpdatedAt(new Date());
      setStale(false);
      setStatus("ready");
    } catch (e) {
      if (started !== generation.current) return;
      if (quiet) setStale(true);
      else {
        setError(message(e, "Chưa tải được danh sách đơn."));
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  usePolling(() => void load(true), POLL_MS, true);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!delivered) return;
    const timer = setTimeout(() => setDelivered(undefined), SUCCESS_MS);
    return () => clearTimeout(timer);
  }, [delivered]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const run = useCallback(
    async (id: string, action: DeliveryAction) => {
      if (acting.current) return;
      acting.current = true;
      generation.current += 1;
      setPending({ id, action });
      setNotice("");
      try {
        const result = await deliveriesApi[action](id);
        if (action === "deliver") setDelivered(result);
        setOverview((previous) =>
          previous
            ? {
                ...previous,
                current: action === "deliver" ? null : result,
                available: previous.available.filter((d) => d.id !== id)
              }
            : previous
        );
      } catch (e) {
        setNotice(message(e, "Chưa thực hiện được. Vui lòng thử lại."));
      } finally {
        generation.current += 1;
        acting.current = false;
        setPending(undefined);
      }
      await load(true);
    },
    [load]
  );

  return {
    status,
    overview,
    error,
    updatedAt,
    stale,
    refreshing,
    pending,
    notice,
    delivered,
    reload: () => void load(),
    refresh: () => void refresh(),
    claim: (id: string) => void run(id, "claim"),
    pickup: (id: string) => void run(id, "pickup"),
    deliver: (id: string) => void run(id, "deliver"),
    dismissNotice: () => setNotice(""),
    dismissDelivered: () => setDelivered(undefined)
  };
}

export type DeliveriesState = ReturnType<typeof useDeliveries>;
