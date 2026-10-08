import { useCallback, useEffect, useRef, useState } from "react";

import { attempt, type Outcome } from "../services/api";
import {
  createProduct,
  deleteProduct,
  fetchCatalog,
  fetchStoreOverview,
  updateProduct
} from "../services/storefront";
import type {
  MerchantCatalog,
  MerchantProduct,
  ProductInput,
  ProductRemoval,
  ProductUpdateInput,
  StoreOverview
} from "../types/storefront";
import { findProduct, patchProduct } from "../utils/storefront";

export type StorefrontPhase = "loading" | "ready" | "error" | "unauthorized";
export type CatalogPhase = "idle" | "loading" | "ready" | "error";

/**
 * The merchant's store overview and catalog, shared by every tab so a change
 * on one screen shows everywhere. Mutations return an Outcome so screens can
 * show the server's Vietnamese message where the action happened.
 */
export function useStorefront() {
  const [overview, setOverview] = useState<StoreOverview>();
  const [phase, setPhase] = useState<StorefrontPhase>("loading");
  const [error, setError] = useState("");
  const [catalog, setCatalog] = useState<MerchantCatalog>();
  const [catalogPhase, setCatalogPhase] = useState<CatalogPhase>("idle");
  const [catalogError, setCatalogError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const loadingOverview = useRef<Promise<void> | null>(null);
  const loadingCatalog = useRef<Promise<void> | null>(null);

  /** Marks the session expired on 401; returns the outcome unchanged. */
  const guard = useCallback(<T>(outcome: Outcome<T>): Outcome<T> => {
    if (!outcome.ok && outcome.status === 401) setPhase("unauthorized");
    return outcome;
  }, []);

  const loadOverview = useCallback((): Promise<void> => {
    if (loadingOverview.current) return loadingOverview.current;
    const run = (async () => {
      const result = guard(await attempt(fetchStoreOverview));
      if (result.ok) {
        setOverview(result.value);
        setError("");
        setPhase("ready");
      } else if (result.status !== 401) {
        setError(result.message);
        // An overview already on screen stays usable after a failed refresh.
        setPhase((current) => (current === "ready" ? current : "error"));
      }
      loadingOverview.current = null;
    })();
    loadingOverview.current = run;
    return run;
  }, [guard]);

  const loadCatalog = useCallback((): Promise<void> => {
    if (loadingCatalog.current) return loadingCatalog.current;
    const run = (async () => {
      setCatalogPhase((current) => (current === "ready" ? current : "loading"));
      const result = guard(await attempt(fetchCatalog));
      if (result.ok) {
        setCatalog(result.value);
        setCatalogError("");
        setCatalogPhase("ready");
      } else {
        setCatalogError(result.message);
        setCatalogPhase((current) => (current === "ready" ? current : "error"));
      }
      loadingCatalog.current = null;
    })();
    loadingCatalog.current = run;
    return run;
  }, [guard]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const retry = useCallback(() => {
    setPhase("loading");
    void loadOverview();
  }, [loadOverview]);

  /** Pull-to-refresh for screens showing both overview and catalog. */
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadOverview(), loadCatalog()]);
    setRefreshing(false);
  }, [loadOverview, loadCatalog]);

  /** Runs a store change that answers with the new overview. */
  const mutateStore = useCallback(
    async (task: () => Promise<StoreOverview>) => {
      const result = guard(await attempt(task));
      if (result.ok) {
        setOverview(result.value);
        setPhase("ready");
      }
      return result;
    },
    [guard]
  );

  /** Runs a catalog change that answers with the new catalog. */
  const mutateCatalog = useCallback(
    async (task: () => Promise<MerchantCatalog>) => {
      const result = guard(await attempt(task));
      if (result.ok) {
        setCatalog(result.value);
        setCatalogPhase("ready");
        // Counts and setup steps depend on the catalog.
        void loadOverview();
      }
      return result;
    },
    [guard, loadOverview]
  );

  /** Optimistic availability switch; only this product rolls back on failure. */
  const setAvailability = useCallback(
    async (product: MerchantProduct, isAvailable: boolean) => {
      setCatalog((current) =>
        current ? patchProduct(current, product.id, { isAvailable }) : current
      );
      const result = guard(
        await attempt(() => updateProduct(product.id, { isAvailable }))
      );
      setCatalog((current) =>
        current
          ? patchProduct(
              current,
              product.id,
              result.ok ? result.value : { isAvailable: !isAvailable }
            )
          : current
      );
      if (result.ok) void loadOverview();
      return result;
    },
    [guard, loadOverview]
  );

  /** Creates or updates a product, then refreshes catalog and counts. */
  const saveProduct = useCallback(
    async (
      productId: string | undefined,
      input: ProductInput | ProductUpdateInput
    ) => {
      const result = guard(
        await attempt(() =>
          productId
            ? updateProduct(productId, input)
            : createProduct(input as ProductInput)
        )
      );
      if (result.ok) {
        setCatalog((current) =>
          current && productId && findProduct(current, productId)
            ? patchProduct(current, productId, result.value)
            : current
        );
        void loadCatalog();
        void loadOverview();
      }
      return result;
    },
    [guard, loadCatalog, loadOverview]
  );

  const removeProduct = useCallback(
    async (productId: string): Promise<Outcome<ProductRemoval>> => {
      const result = guard(await attempt(() => deleteProduct(productId)));
      if (result.ok) {
        setCatalog(result.value.catalog);
        void loadOverview();
      }
      return result;
    },
    [guard, loadOverview]
  );

  return {
    overview,
    store: overview?.store ?? null,
    phase,
    error,
    catalog,
    catalogPhase,
    catalogError,
    refreshing,
    loadOverview,
    loadCatalog,
    retry,
    refreshAll,
    mutateStore,
    mutateCatalog,
    setAvailability,
    saveProduct,
    removeProduct
  };
}

export type Storefront = ReturnType<typeof useStorefront>;
