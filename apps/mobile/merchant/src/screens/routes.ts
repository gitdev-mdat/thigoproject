import type { TabKey } from "../components/shell/TabBar";
import type { ToastMessage } from "../components/Toast";
import type { BackGuard } from "../hooks/useScreenStack";

/** Drill-in screens pushed over the tabs. */
export type Route =
  | { name: "tabs" }
  | {
      name: "product";
      productId?: string | undefined;
      categoryId?: string | undefined;
    }
  | { name: "storeProfile" }
  | { name: "hours" };

export type Navigation = {
  goTab: (tab: TabKey) => void;
  /** Without an id the form creates a product, optionally in `categoryId`. */
  openProduct: (productId?: string, categoryId?: string) => void;
  openStoreProfile: () => void;
  openHours: () => void;
  /** Switches to Thực đơn and opens the add-category sheet. */
  addCategory: () => void;
  /** Header and hardware back; asks the screen's guard first. */
  back: () => void;
  /** Lets the top screen intercept back; returns the cleanup. */
  setBackGuard: (guard: BackGuard) => () => void;
};

export type Notify = (message: string, tone?: ToastMessage["tone"]) => void;
