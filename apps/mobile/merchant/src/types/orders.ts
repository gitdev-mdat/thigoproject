/** Contracts of the THIGO API used by the Merchant app. Money is integer VND. */
export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED";

export type OrderLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceVnd: number;
  lineTotalVnd: number;
  options: { groupName: string; name: string; priceDeltaVnd: number }[];
};

/**
 * The merchant view of an order. The API leaves the customer's delivery
 * address empty for stores, so it is intentionally not modelled here.
 */
export type MerchantOrder = {
  id: string;
  code: string;
  status: OrderStatus;
  placedAt: string;
  driverAssigned: boolean;
  paymentMethod: "COD";
  itemCount: number;
  subtotalVnd: number;
  deliveryFeeVnd: number;
  totalVnd: number;
  items: OrderLine[];
  customerNote: string | null;
  rejectReason: string | null;
  timeline: {
    placedAt: string;
    acceptedAt: string | null;
    preparingAt: string | null;
    readyAt: string | null;
    assignedAt: string | null;
    pickedUpAt: string | null;
    deliveredAt: string | null;
    closedAt: string | null;
  };
};

/** Why customers cannot order right now; null while the store is open. */
export type StoreClosedReason = "UNPUBLISHED" | "PAUSED" | "OUTSIDE_HOURS";

export type MerchantStore = {
  id: string;
  name: string;
  addressLine: string;
  isActive: boolean;
  /** Absent from older API responses. */
  closedReason?: StoreClosedReason | null;
};

export type OrderBoard = {
  store: MerchantStore;
  /** PENDING → READY_FOR_PICKUP, oldest first. */
  active: MerchantOrder[];
  /** Closed or handed over, newest first (at most 20). */
  recent: MerchantOrder[];
};

export type OrderAction = "accept" | "prepare" | "ready" | "reject";
