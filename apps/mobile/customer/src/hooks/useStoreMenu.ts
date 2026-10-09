import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../services/api";
import { catalogApi } from "../services/catalog";
import type { StoreDetail } from "../types/catalog";

type Status = "loading" | "ready" | "missing" | "error";

export function useStoreMenu(storeId: string) {
  const [status, setStatus] = useState<Status>("loading");
  const [store, setStore] = useState<StoreDetail>();

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setStore(await catalogApi.store(storeId));
      setStatus("ready");
    } catch (error) {
      setStatus(
        error instanceof ApiError && error.status === 404 ? "missing" : "error"
      );
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { status, store, reload: load };
}
