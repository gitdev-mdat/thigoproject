/** Contracts of the THIGO API used by the Customer app. Money is integer VND. */
export type StoreCategory = "FOOD" | "COFFEE" | "MILK_TEA";

export type StoreClosedReason = "UNPUBLISHED" | "PAUSED" | "OUTSIDE_HOURS";

/** Monday-first weekly hours in Vietnam time; null for a closed day. */
export type OpeningHours = ({ open: string; close: string } | null)[];

export type StoreSummary = {
  id: string;
  name: string;
  category: StoreCategory;
  description: string | null;
  addressLine: string;
  coverImageUrl: string | null;
  logoImageUrl: string | null;
  productCount: number;
  /** Whether the store takes orders right now; decided by the server. */
  isOpen: boolean;
  closedReason: StoreClosedReason | null;
};

export type DishSummary = {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  description: string | null;
  priceVnd: number;
  imageUrl: string | null;
};

export type ProductOption = {
  id: string;
  name: string;
  priceDeltaVnd: number;
  isAvailable: boolean;
};

export type ProductOptionGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: ProductOption[];
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  priceVnd: number;
  imageUrl: string | null;
  isAvailable: boolean;
  optionGroups: ProductOptionGroup[];
};

export type StoreDetail = StoreSummary & {
  phone: string | null;
  openingHours: OpeningHours | null;
  categories: { id: string; name: string; products: Product[] }[];
};

export type HomeShortcut = { key: StoreCategory; label: string };

export type RecommendationsResponse = {
  category: StoreCategory;
  stores: StoreSummary[];
  dishes: DishSummary[];
};

export type SearchResponse = {
  query: string;
  stores: StoreSummary[];
  dishes: DishSummary[];
};
