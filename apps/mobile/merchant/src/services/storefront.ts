import type {
  CategoryUpdateInput,
  MerchantCatalog,
  MerchantProduct,
  MoveDirection,
  OpeningHours,
  ProductInput,
  ProductRemoval,
  ProductUpdateInput,
  StoreOverview,
  StoreProfileInput,
  StoreUpdateInput
} from "../types/storefront";
import { apiRequest } from "./api";

const id = (value: string) => encodeURIComponent(value);

// ---- Store ----

export function fetchStoreOverview(): Promise<StoreOverview> {
  return apiRequest<StoreOverview>("/merchant/store");
}

/** Creates the merchant's one store; 409 when it already exists. */
export function createStore(input: StoreProfileInput): Promise<StoreOverview> {
  return apiRequest<StoreOverview>("/merchant/store", {
    method: "POST",
    body: input
  });
}

export function updateStore(input: StoreUpdateInput): Promise<StoreOverview> {
  return apiRequest<StoreOverview>("/merchant/store", {
    method: "PATCH",
    body: input
  });
}

/** `null` removes the hour limit; otherwise seven Monday-first days. */
export function saveOpeningHours(
  hours: OpeningHours | null
): Promise<StoreOverview> {
  return apiRequest<StoreOverview>("/merchant/store/hours", {
    method: "PUT",
    body: { hours }
  });
}

export function setAcceptingOrders(
  acceptingOrders: boolean
): Promise<StoreOverview> {
  return apiRequest<StoreOverview>("/merchant/store/accepting-orders", {
    method: "POST",
    body: { acceptingOrders }
  });
}

/** 400 unless the store has a phone, an address and an orderable product. */
export function setPublished(published: boolean): Promise<StoreOverview> {
  return apiRequest<StoreOverview>("/merchant/store/publication", {
    method: "POST",
    body: { published }
  });
}

// ---- Catalog ----

export function fetchCatalog(): Promise<MerchantCatalog> {
  return apiRequest<MerchantCatalog>("/merchant/catalog");
}

export function createCategory(name: string): Promise<MerchantCatalog> {
  return apiRequest<MerchantCatalog>("/merchant/categories", {
    method: "POST",
    body: { name }
  });
}

export function updateCategory(
  categoryId: string,
  input: CategoryUpdateInput
): Promise<MerchantCatalog> {
  return apiRequest<MerchantCatalog>(`/merchant/categories/${id(categoryId)}`, {
    method: "PATCH",
    body: input
  });
}

export function moveCategory(
  categoryId: string,
  direction: MoveDirection
): Promise<MerchantCatalog> {
  return apiRequest<MerchantCatalog>(
    `/merchant/categories/${id(categoryId)}/move`,
    { method: "POST", body: { direction } }
  );
}

/** 409 while the category still has products. */
export function deleteCategory(categoryId: string): Promise<MerchantCatalog> {
  return apiRequest<MerchantCatalog>(`/merchant/categories/${id(categoryId)}`, {
    method: "DELETE"
  });
}

export function createProduct(input: ProductInput): Promise<MerchantProduct> {
  return apiRequest<MerchantProduct>("/merchant/products", {
    method: "POST",
    body: input
  });
}

export function updateProduct(
  productId: string,
  input: ProductUpdateInput
): Promise<MerchantProduct> {
  return apiRequest<MerchantProduct>(`/merchant/products/${id(productId)}`, {
    method: "PATCH",
    body: input
  });
}

export function moveProduct(
  productId: string,
  direction: MoveDirection
): Promise<MerchantCatalog> {
  return apiRequest<MerchantCatalog>(
    `/merchant/products/${id(productId)}/move`,
    { method: "POST", body: { direction } }
  );
}

/** Products that appear in past orders are archived instead of deleted. */
export function deleteProduct(productId: string): Promise<ProductRemoval> {
  return apiRequest<ProductRemoval>(`/merchant/products/${id(productId)}`, {
    method: "DELETE"
  });
}
