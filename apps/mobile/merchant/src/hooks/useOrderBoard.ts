import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "../services/api";
import { fetchOrderBoard, runOrderAction } from "../services/orders";
import type { MerchantOrder, OrderAction, OrderBoard } from "../types/orders";
import { applyOrderUpdate, nextStep } from "../utils/board";
import { usePolling } from "./usePolling";

/** How often the board asks the API for new orders while in the foreground. */
export const BOARD_POLL_MS = 5000;

/** How long an action notice stays before it clears itself. */
const NOTICE_MS = 8000;

export type BoardPhase =
  "loading" | "ready" | "error" | "noStore" | "unauthorized";

export type BoardNotice = {
  id: number;
  message: string;
  tone: "success" | "warning" | "danger";
};

export type PendingAction = { orderId: string; action: OrderAction };

export type ActionResult =
  { ok: true } | { ok: false; message: string; settled: boolean };

const errorMessage = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Không thể kết nối. Vui lòng thử lại.";

export function useOrderBoard() {
  const [board, setBoard] = useState<OrderBoard>();
  const [phase, setPhase] = useState<BoardPhase>("loading");
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date>();
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [notice, setNotice] = useState<BoardNotice | null>(null);

  const inflight = useRef<Promise<void> | null>(null);
  const inflightGeneration = useRef(0);
  const acting = useRef(false);
  // Bumped whenever an action lands, so a poll that started earlier cannot
  // overwrite the newer state with what it read before the action.
  const generation = useRef(0);
  const noticeId = useRef(0);

  const showNotice = useCallback(
    (message: string, tone: BoardNotice["tone"]) => {
      noticeId.current += 1;
      setNotice({ id: noticeId.current, message, tone });
    },
    []
  );

  const load = useCallback((): Promise<void> => {
    if (inflight.current) {
      // A read that started before the latest action is discarded, so queue a
      // fresh one behind it instead of sharing it.
      if (inflightGeneration.current === generation.current)
        return inflight.current;
      return inflight.current.then(() => load());
    }
    const startedAt = generation.current;
    inflightGeneration.current = startedAt;
    const run = (async () => {
      try {
        const next = await fetchOrderBoard();
        if (startedAt !== generation.current) return;
        setBoard(next);
        setPhase("ready");
        setStale(false);
        setError("");
        setUpdatedAt(new Date());
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          setError(e.message);
          setPhase("noStore");
          return;
        }
        if (e instanceof ApiError && e.status === 401) {
          setPhase("unauthorized");
          return;
        }
        setError(errorMessage(e));
        setStale(true);
        // A board already on screen stays usable; only a first load fails hard.
        setPhase((current) => (current === "ready" ? current : "error"));
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = run;
    return run;
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  usePolling(
    () => void load(),
    BOARD_POLL_MS,
    phase === "ready" || phase === "error"
  );

  const pullToRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = useCallback(() => {
    setPhase("loading");
    void load();
  }, [load]);

  const act = useCallback(
    async (
      order: MerchantOrder,
      action: OrderAction,
      reason?: string
    ): Promise<ActionResult> => {
      if (acting.current) return { ok: false, message: "", settled: false };
      acting.current = true;
      setPending({ orderId: order.id, action });
      try {
        const updated = await runOrderAction(order.id, action, reason);
        generation.current += 1;
        setBoard((current) =>
          current ? applyOrderUpdate(current, updated) : current
        );
        showNotice(
          action === "reject"
            ? `Đã từ chối đơn #${order.code}.`
            : `#${order.code}: ${nextStep(order.status)?.done ?? "Đã cập nhật đơn."}`,
          "success"
        );
        return { ok: true };
      } catch (e) {
        const message = errorMessage(e);
        const status = e instanceof ApiError ? e.status : "network";
        if (status === 403) {
          setError(message);
          setPhase("noStore");
        } else if (status === 401) {
          setPhase("unauthorized");
        }
        // 409/404: the order already moved or is not this store's; the
        // server's message explains it and the board is refreshed.
        const settled = status === 409 || status === 404;
        if (settled) {
          generation.current += 1;
          showNotice(message, "warning");
        }
        return { ok: false, message, settled };
      } finally {
        acting.current = false;
        setPending(null);
        void load();
      }
    },
    [load, showNotice]
  );

  const dismissNotice = useCallback(() => setNotice(null), []);

  const reportError = useCallback(
    (message: string) => showNotice(message, "danger"),
    [showNotice]
  );

  return {
    board,
    phase,
    error,
    stale,
    updatedAt,
    refreshing,
    pending,
    notice,
    dismissNotice,
    reportError,
    pullToRefresh,
    retry,
    act
  };
}

export type OrderBoardState = ReturnType<typeof useOrderBoard>;
