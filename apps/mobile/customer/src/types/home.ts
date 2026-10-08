/**
 * Response shapes for the Customer home endpoints. They mirror the planned
 * NestJS contract so the mock source can be swapped for the real API.
 */

export type StoreCategory = "food" | "coffee" | "milk_tea";

export type DeliveryAddress = {
  id: string;
  label: string;
  line: string;
};

export type HomeShortcut =
  | {
      id: string;
      kind: "category";
      category: StoreCategory;
      label: string;
      art: string;
    }
  | { id: string; kind: "recent_orders"; label: string; art: string };

export type Promotion = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  code: string | null;
};

/** GET /customer/home */
export type CustomerHomeResponse = {
  greetingName: string | null;
  address: DeliveryAddress;
  shortcuts: HomeShortcut[];
  promotions: Promotion[];
};

export type StoreSummary = {
  id: string;
  name: string;
  category: StoreCategory;
  tags: string[];
  rating: number;
  ratingCount: number;
  etaMinutes: { min: number; max: number };
  art: string;
};

export type DishSummary = {
  id: string;
  name: string;
  storeName: string;
  category: StoreCategory;
  /** Integer VND. */
  price: number;
  art: string;
};

/** GET /customer/recommendations?category= */
export type RecommendationsResponse = {
  category: StoreCategory;
  stores: StoreSummary[];
  dishes: DishSummary[];
};

export type RecentOrder = {
  id: string;
  storeName: string;
  itemsSummary: string;
  /** Integer VND. */
  total: number;
  status: "delivered" | "cancelled";
  placedAt: string;
  art: string;
};

/** GET /customer/recent-orders */
export type RecentOrdersResponse = { orders: RecentOrder[] };

/** GET /customer/search?q= */
export type SearchResponse = {
  query: string;
  stores: StoreSummary[];
  dishes: DishSummary[];
};
