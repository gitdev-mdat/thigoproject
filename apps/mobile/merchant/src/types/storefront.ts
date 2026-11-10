/** Storefront and catalog contracts of the THIGO API. Money is integer VND. */
export type StoreCategory = "FOOD" | "COFFEE" | "MILK_TEA";

export type ClosedReason = "UNPUBLISHED" | "PAUSED" | "OUTSIDE_HOURS";

/** One day's same-day window, "HH:MM" 24-hour local time. */
export type DayHours = { open: string; close: string };

/** Seven Monday-first days; a null day is closed. */
export type OpeningHours = (DayHours | null)[];

export type MerchantStoreProfile = {
  id: string;
  name: string;
  category: StoreCategory;
  description: string | null;
  addressLine: string;
  /** Canonical +84… form, or null when the store has none yet. */
  phone: string | null;
  logoImageUrl: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  isAcceptingOrders: boolean;
  /** null means no hour limit. */
  openingHours: OpeningHours | null;
  isOpenNow: boolean;
  closedReason: ClosedReason | null;
};

export type SetupStepKey = "PROFILE" | "IMAGES" | "MENU" | "PUBLISH";

export type SetupStep = {
  key: SetupStepKey;
  label: string;
  done: boolean;
  required: boolean;
};

export type CatalogCounts = {
  categoryCount: number;
  productCount: number;
  availableCount: number;
  unavailableCount: number;
};

export type StoreOverview = {
  store: MerchantStoreProfile | null;
  setup: SetupStep[];
  catalog: CatalogCounts;
  /** Publishing needs a phone, an address and at least one orderable product. */
  canPublish: boolean;
};

export type MerchantProduct = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceVnd: number;
  imageUrl: string | null;
  isAvailable: boolean;
  /** Seeded size/topping groups; read-only in this release. */
  optionGroupCount: number;
};

export type MerchantCategory = {
  id: string;
  name: string;
  isActive: boolean;
  products: MerchantProduct[];
};

export type MerchantCatalog = { categories: MerchantCategory[] };

export type ProductRemoval = {
  /** "archived" keeps the product for past orders; "deleted" removes it. */
  outcome: "archived" | "deleted";
  catalog: MerchantCatalog;
};

export type MediaUpload = {
  id: string;
  /** Usually relative, e.g. "/media/<id>". */
  url: string;
  contentType: string;
  byteSize: number;
};

export type MoveDirection = "up" | "down";

export type StoreProfileInput = {
  name: string;
  category: StoreCategory;
  description?: string | null;
  addressLine: string;
  phone: string;
};

export type StoreUpdateInput = Partial<StoreProfileInput> & {
  logoMediaId?: string | null;
  coverMediaId?: string | null;
};

export type ProductInput = {
  name: string;
  categoryId: string;
  description?: string | null;
  priceVnd: number;
  isAvailable?: boolean;
  imageMediaId?: string | null;
};

export type ProductUpdateInput = Partial<ProductInput>;

export type CategoryUpdateInput = { name?: string; isActive?: boolean };
