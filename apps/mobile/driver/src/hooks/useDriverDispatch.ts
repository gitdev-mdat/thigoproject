import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "../services/api";
import { dispatchApi } from "../services/dispatch";
import type { Delivery } from "../types/delivery";
import type { DeliveryOffer, DriverEarnings } from "../types/dispatch";
import { usePolling } from "./usePolling";

const OFFER_POLL_MS = 3_000;

const message = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

/** Lightweight foreground polling until the project has a push channel. */
export function useDriverDispatch(enabled: boolean) {
  const [offer, setOffer] = useState<DeliveryOffer | null>();
  const [earnings, setEarnings] = useState<DriverEarnings>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"accept" | "reject">();
  const acting = useRef(false);

  const loadOffer = useCallback(async (quiet = false) => {
    if (acting.current) return;
    try {
      setOffer(await dispatchApi.currentOffer());
      setError("");
    } catch (cause) {
      if (!quiet) setError(message(cause, "Chưa tải được đề nghị giao hàng."));
    }
  }, []);

  const loadEarnings = useCallback(async () => {
    try {
      setEarnings(await dispatchApi.earnings());
    } catch (cause) {
      setError(message(cause, "Chưa tải được thu nhập tài xế."));
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadOffer(), loadEarnings()]);
  }, [loadEarnings, loadOffer]);
  usePolling(() => void loadOffer(true), OFFER_POLL_MS, enabled);

  const accept = useCallback(async (): Promise<Delivery | null> => {
    if (!offer || acting.current) return null;
    acting.current = true;
    setPending("accept");
    setError("");
    try {
      const delivery = await dispatchApi.accept(offer.id);
      setOffer(null);
      return delivery;
    } catch (cause) {
      setError(message(cause, "Chưa nhận được đơn. Vui lòng thử lại."));
      await loadOffer(true);
      return null;
    } finally {
      acting.current = false;
      setPending(undefined);
    }
  }, [loadOffer, offer]);

  const reject = useCallback(async () => {
    if (!offer || acting.current) return;
    acting.current = true;
    setPending("reject");
    setError("");
    try {
      await dispatchApi.reject(offer.id);
      setOffer(null);
      setTimeout(() => void loadOffer(true), 500);
    } catch (cause) {
      setError(message(cause, "Chưa từ chối được đề nghị."));
      await loadOffer(true);
    } finally {
      acting.current = false;
      setPending(undefined);
    }
  }, [loadOffer, offer]);

  const rejectCurrent = useCallback(() => void reject(), [reject]);
  const reloadOffer = useCallback(() => void loadOffer(), [loadOffer]);
  const refreshEarnings = useCallback(
    () => void loadEarnings(),
    [loadEarnings]
  );

  return {
    offer,
    earnings,
    error,
    pending,
    accept,
    reject: rejectCurrent,
    reloadOffer,
    refreshEarnings
  };
}
