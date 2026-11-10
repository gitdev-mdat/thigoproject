import type {
  StoreProfileInput,
  StoreUpdateInput,
  MerchantCatalog,
  MerchantProduct,
  MerchantStoreProfile,
  SetupStep,
  StoreCategory,
  StoreOverview
} from "../types/storefront";

export const STORE_CATEGORIES: { value: StoreCategory; label: string }[] = [
  { value: "FOOD", label: "Đồ ăn" },
  { value: "COFFEE", label: "Cà phê" },
  { value: "MILK_TEA", label: "Trà sữa" }
];

export function storeCategoryLabel(value: StoreCategory): string {
  return STORE_CATEGORIES.find((item) => item.value === value)?.label ?? value;
}

export type StoreStatusTone = "success" | "warning" | "info" | "neutral";

export type StoreStatus = {
  key: "OPEN" | "PAUSED" | "OUTSIDE_HOURS" | "UNPUBLISHED";
  label: string;
  detail: string;
  tone: StoreStatusTone;
};

/** What customers experience right now, in the store owner's words. */
export function storeStatus(store: MerchantStoreProfile): StoreStatus {
  const reason =
    store.closedReason ??
    (!store.isPublished
      ? "UNPUBLISHED"
      : !store.isAcceptingOrders
        ? "PAUSED"
        : store.isOpenNow
          ? null
          : "OUTSIDE_HOURS");
  switch (reason) {
    case "UNPUBLISHED":
      return {
        key: "UNPUBLISHED",
        label: "Chưa hiển thị",
        detail: "Khách chưa thấy cửa hàng trên THIGO.",
        tone: "neutral"
      };
    case "PAUSED":
      return {
        key: "PAUSED",
        label: "Tạm ngưng",
        detail: "Khách thấy cửa hàng nhưng chưa đặt được món.",
        tone: "warning"
      };
    case "OUTSIDE_HOURS":
      return {
        key: "OUTSIDE_HOURS",
        label: "Ngoài giờ",
        detail: "Ngoài giờ mở cửa đã đặt. Khách đặt được khi đến giờ.",
        tone: "info"
      };
    default:
      return {
        key: "OPEN",
        label: "Đang mở",
        detail: "Khách đang đặt được món.",
        tone: "success"
      };
  }
}

export function setupProgress(setup: SetupStep[]): {
  done: number;
  total: number;
  complete: boolean;
} {
  const done = setup.filter((step) => step.done).length;
  return { done, total: setup.length, complete: done === setup.length };
}

/**
 * Plain reasons the store cannot be shown to customers yet. Empty when the
 * server says it can publish; the server remains the authority.
 */
export function publishBlockers(overview: StoreOverview): string[] {
  if (overview.canPublish || !overview.store) return [];
  const reasons: string[] = [];
  if (!overview.store.phone) reasons.push("Thêm số điện thoại cửa hàng.");
  if (!overview.store.addressLine.trim())
    reasons.push("Thêm địa chỉ cửa hàng.");
  if (overview.catalog.availableCount === 0)
    reasons.push("Thêm ít nhất một món đang bán.");
  if (!reasons.length)
    reasons.push("Cần ít nhất một món đang bán trong danh mục đang hiển thị.");
  return reasons;
}

// ---- Store profile ----

export type StoreProfileDraft = {
  name: string;
  category: StoreCategory | null;
  addressLine: string;
  phone: string;
  description: string;
};

export type StoreProfileErrors = Partial<
  Record<keyof StoreProfileDraft, string>
>;

const compactPhone = (value: string) => value.trim().replace(/[\s.()-]/g, "");

/** Mobile or landline number in local (0…) or +84 form; a hint only. */
export function isLikelyStorePhone(value: string): boolean {
  const compact = compactPhone(value);
  const canonical = compact.startsWith("0")
    ? `+84${compact.slice(1)}`
    : compact;
  return /^\+84(?:2\d{9}|[35789]\d{8})$/.test(canonical);
}

/** "+84901234567" -> "0901 234 567" for editing in local form. */
export function toLocalPhone(value: string | null): string {
  if (!value) return "";
  const compact = compactPhone(value);
  const local = compact.startsWith("+84") ? `0${compact.slice(3)}` : compact;
  if (local.length === 10)
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  if (local.length === 11)
    return `${local.slice(0, 3)} ${local.slice(3, 7)} ${local.slice(7)}`;
  return local;
}

export function profileDraft(
  store: Pick<
    MerchantStoreProfile,
    "name" | "category" | "addressLine" | "phone" | "description"
  > | null
): StoreProfileDraft {
  return {
    name: store?.name ?? "",
    category: store?.category ?? null,
    addressLine: store?.addressLine ?? "",
    phone: toLocalPhone(store?.phone ?? null),
    description: store?.description ?? ""
  };
}

/** Client hints that mirror the API rules; the API decides. */
export function validateProfile(draft: StoreProfileDraft): StoreProfileErrors {
  const errors: StoreProfileErrors = {};
  const name = draft.name.trim();
  if (name.length < 2) errors.name = "Tên cửa hàng cần ít nhất 2 ký tự.";
  else if (name.length > 120) errors.name = "Tên cửa hàng tối đa 120 ký tự.";
  if (!draft.category) errors.category = "Chọn loại cửa hàng.";
  const address = draft.addressLine.trim();
  if (address.length < 5)
    errors.addressLine = "Nhập địa chỉ cụ thể (số nhà, đường, phường/quận).";
  else if (address.length > 255)
    errors.addressLine = "Địa chỉ tối đa 255 ký tự.";
  if (!draft.phone.trim()) errors.phone = "Nhập số điện thoại cửa hàng.";
  else if (!isLikelyStorePhone(draft.phone))
    errors.phone = "Số chưa hợp lệ. Ví dụ: 0901 234 567 hoặc 028 3822 1234.";
  if (draft.description.trim().length > 500)
    errors.description = "Mô tả tối đa 500 ký tự.";
  return errors;
}

/** API body for creating a store from a validated draft. */
export function profileInput(draft: StoreProfileDraft): StoreProfileInput {
  const description = draft.description.trim();
  return {
    name: draft.name.trim(),
    category: draft.category ?? "FOOD",
    addressLine: draft.addressLine.trim(),
    phone: compactPhone(draft.phone),
    ...(description ? { description } : {})
  };
}

/** Only the fields that changed, so an edit never rewrites untouched data. */
export function profileChanges(
  draft: StoreProfileDraft,
  store: MerchantStoreProfile
): StoreUpdateInput {
  const next = profileInput(draft);
  const changes: StoreUpdateInput = {};
  if (next.name !== store.name) changes.name = next.name;
  if (next.category !== store.category) changes.category = next.category;
  if (next.addressLine !== store.addressLine)
    changes.addressLine = next.addressLine;
  if (compactPhone(toLocalPhone(store.phone)) !== next.phone)
    changes.phone = next.phone;
  const description = next.description ?? null;
  if (description !== (store.description ?? null))
    changes.description = description;
  return changes;
}

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;

// ---- Catalog ----

export function findProduct(
  catalog: MerchantCatalog | undefined,
  productId: string
): MerchantProduct | undefined {
  for (const category of catalog?.categories ?? []) {
    const product = category.products.find((item) => item.id === productId);
    if (product) return product;
  }
  return undefined;
}

/** Replaces one product's fields everywhere it appears. */
export function patchProduct(
  catalog: MerchantCatalog,
  productId: string,
  patch: Partial<MerchantProduct>
): MerchantCatalog {
  return {
    categories: catalog.categories.map((category) =>
      category.products.some((item) => item.id === productId)
        ? {
            ...category,
            products: category.products.map((item) =>
              item.id === productId ? { ...item, ...patch } : item
            )
          }
        : category
    )
  };
}

/** Index of a product within its category and that category's size. */
export function productPosition(
  catalog: MerchantCatalog | undefined,
  productId: string
): { index: number; count: number } | undefined {
  for (const category of catalog?.categories ?? []) {
    const index = category.products.findIndex((item) => item.id === productId);
    if (index >= 0) return { index, count: category.products.length };
  }
  return undefined;
}

export function optionLabel(count: number): string | undefined {
  return count > 0 ? `${count} tuỳ chọn` : undefined;
}

/** First letter for an image placeholder, e.g. "Cơm tấm" -> "C". */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase("vi-VN") || "?";
}
