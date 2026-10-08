import { BadRequestException } from "@nestjs/common";
import {
  isValidTime,
  minutesOf
} from "../../common/catalog/store-availability.js";
import {
  StoreCategory,
  type OpeningHours
} from "../../entities/catalog/store.entity.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MIN_PRICE_VND = 1_000;
export const MAX_PRICE_VND = 10_000_000;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function invalid(message = "Dữ liệu gửi lên không hợp lệ."): never {
  throw new BadRequestException(message);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function text(value: unknown, max: number, label: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") invalid(`${label} không hợp lệ.`);
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length > max) invalid(`${label} tối đa ${max} ký tự.`);
  return trimmed || null;
}

function required(value: unknown, min: number, max: number, label: string) {
  const result = text(value, max, label);
  if (!result || result.length < min)
    invalid(`${label} cần ít nhất ${min} ký tự.`);
  return result;
}

/** Multi-line text keeps its line breaks but trims each end. */
function paragraph(value: unknown, max: number, label: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") invalid(`${label} không hợp lệ.`);
  const trimmed = value.trim();
  if (trimmed.length > max) invalid(`${label} tối đa ${max} ký tự.`);
  return trimmed || null;
}

function has(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function bool(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") invalid(`${label} không hợp lệ.`);
  return value;
}

/** Mobile (+84 3/5/7/8/9 …) or landline (+84 2…) numbers, stored as +84… */
export function parseStorePhone(value: unknown): string {
  if (typeof value !== "string")
    invalid("Vui lòng nhập số điện thoại cửa hàng.");
  const compact = value.trim().replace(/[\s.()-]/g, "");
  const canonical = compact.startsWith("0")
    ? `+84${compact.slice(1)}`
    : compact;
  if (!/^\+84(?:2\d{9}|[35789]\d{8})$/.test(canonical))
    invalid("Số điện thoại cửa hàng không hợp lệ.");
  return canonical;
}

function category(value: unknown): StoreCategory {
  const match = Object.values(StoreCategory).find((item) => item === value);
  if (!match) invalid("Vui lòng chọn loại cửa hàng.");
  return match;
}

function mediaId(value: unknown): string | null {
  if (value === null) return null;
  if (!isUuid(value)) invalid("Ảnh không hợp lệ.");
  return value;
}

// ---- Store ----

export interface StoreProfileInput {
  name: string;
  category: StoreCategory;
  description: string | null;
  addressLine: string;
  phone: string;
}

export interface StoreUpdateInput {
  name?: string;
  category?: StoreCategory;
  description?: string | null;
  addressLine?: string;
  phone?: string;
  /** null removes the image; a media id attaches an uploaded one. */
  logoMediaId?: string | null;
  coverMediaId?: string | null;
}

export function parseStoreProfile(body: unknown): StoreProfileInput {
  const value = record(body);
  return {
    name: required(value.name, 2, 120, "Tên cửa hàng"),
    category: category(value.category),
    description: paragraph(value.description, 500, "Mô tả"),
    addressLine: required(value.addressLine, 5, 255, "Địa chỉ"),
    phone: parseStorePhone(value.phone)
  };
}

export function parseStoreUpdate(body: unknown): StoreUpdateInput {
  const value = record(body);
  const input: StoreUpdateInput = {};
  if (has(value, "name"))
    input.name = required(value.name, 2, 120, "Tên cửa hàng");
  if (has(value, "category")) input.category = category(value.category);
  if (has(value, "description"))
    input.description = paragraph(value.description, 500, "Mô tả");
  if (has(value, "addressLine"))
    input.addressLine = required(value.addressLine, 5, 255, "Địa chỉ");
  if (has(value, "phone")) input.phone = parseStorePhone(value.phone);
  if (has(value, "logoMediaId")) input.logoMediaId = mediaId(value.logoMediaId);
  if (has(value, "coverMediaId"))
    input.coverMediaId = mediaId(value.coverMediaId);
  if (!Object.keys(input).length) invalid("Không có thay đổi nào.");
  return input;
}

export function parseAcceptingOrders(body: unknown): boolean {
  return bool(record(body).acceptingOrders, "Trạng thái nhận đơn");
}

export function parsePublished(body: unknown): boolean {
  return bool(record(body).published, "Trạng thái hiển thị");
}

/** Seven Monday-first days; each null (closed) or a same-day open/close window. */
export function parseOpeningHours(body: unknown): OpeningHours | null {
  const value = record(body).hours;
  if (value === null) return null;
  if (!Array.isArray(value) || value.length !== 7)
    invalid("Giờ mở cửa cần đủ 7 ngày.");
  const hours = value.map((day: unknown) => {
    if (day === null) return null;
    const window = record(day);
    if (!isValidTime(window.open) || !isValidTime(window.close))
      invalid("Giờ mở cửa không hợp lệ (HH:MM).");
    if (minutesOf(window.close) <= minutesOf(window.open))
      invalid("Giờ đóng cửa phải sau giờ mở cửa trong cùng ngày.");
    return { open: window.open, close: window.close };
  });
  if (hours.every((day) => day === null))
    invalid("Cửa hàng cần mở ít nhất một ngày trong tuần.");
  return hours;
}

// ---- Categories ----

export interface CategoryUpdateInput {
  name?: string;
  isActive?: boolean;
}

export function parseCategoryName(body: unknown): string {
  return required(record(body).name, 1, 80, "Tên danh mục");
}

export function parseCategoryUpdate(body: unknown): CategoryUpdateInput {
  const value = record(body);
  const input: CategoryUpdateInput = {};
  if (has(value, "name"))
    input.name = required(value.name, 1, 80, "Tên danh mục");
  if (has(value, "isActive"))
    input.isActive = bool(value.isActive, "Trạng thái danh mục");
  if (!Object.keys(input).length) invalid("Không có thay đổi nào.");
  return input;
}

export function parseMoveDirection(body: unknown): "up" | "down" {
  const direction = record(body).direction;
  if (direction !== "up" && direction !== "down") invalid();
  return direction;
}

// ---- Products ----

export interface ProductInput {
  name: string;
  categoryId: string;
  description: string | null;
  priceVnd: number;
  isAvailable: boolean;
  imageMediaId: string | null;
}

export type ProductUpdateInput = Partial<ProductInput>;

function price(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < MIN_PRICE_VND ||
    value > MAX_PRICE_VND
  )
    invalid(
      `Giá cần là số nguyên từ ${MIN_PRICE_VND.toLocaleString("vi-VN")} đến ${MAX_PRICE_VND.toLocaleString("vi-VN")} ₫.`
    );
  return value;
}

function categoryId(value: unknown): string {
  if (!isUuid(value)) invalid("Vui lòng chọn danh mục.");
  return value;
}

export function parseProduct(body: unknown): ProductInput {
  const value = record(body);
  return {
    name: required(value.name, 2, 120, "Tên món"),
    categoryId: categoryId(value.categoryId),
    description: paragraph(value.description, 500, "Mô tả món"),
    priceVnd: price(value.priceVnd),
    isAvailable:
      value.isAvailable === undefined
        ? true
        : bool(value.isAvailable, "Trạng thái món"),
    imageMediaId:
      value.imageMediaId === undefined ? null : mediaId(value.imageMediaId)
  };
}

export function parseProductUpdate(body: unknown): ProductUpdateInput {
  const value = record(body);
  const input: ProductUpdateInput = {};
  if (has(value, "name")) input.name = required(value.name, 2, 120, "Tên món");
  if (has(value, "categoryId")) input.categoryId = categoryId(value.categoryId);
  if (has(value, "description"))
    input.description = paragraph(value.description, 500, "Mô tả món");
  if (has(value, "priceVnd")) input.priceVnd = price(value.priceVnd);
  if (has(value, "isAvailable"))
    input.isAvailable = bool(value.isAvailable, "Trạng thái món");
  if (has(value, "imageMediaId"))
    input.imageMediaId = mediaId(value.imageMediaId);
  if (!Object.keys(input).length) invalid("Không có thay đổi nào.");
  return input;
}

// ---- Responses ----

export interface MerchantStoreDto {
  id: string;
  name: string;
  category: StoreCategory;
  description: string | null;
  addressLine: string;
  phone: string | null;
  logoImageUrl: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  isAcceptingOrders: boolean;
  openingHours: OpeningHours | null;
  /** Whether customers can order right now, and why not. */
  isOpenNow: boolean;
  closedReason: "UNPUBLISHED" | "PAUSED" | "OUTSIDE_HOURS" | null;
}

export interface SetupStepDto {
  key: "PROFILE" | "IMAGES" | "MENU" | "PUBLISH";
  label: string;
  done: boolean;
  required: boolean;
}

export interface MerchantStoreOverviewDto {
  store: MerchantStoreDto | null;
  setup: SetupStepDto[];
  catalog: {
    categoryCount: number;
    productCount: number;
    availableCount: number;
    unavailableCount: number;
  };
  /** Publishing needs a phone, an address and at least one orderable product. */
  canPublish: boolean;
}

export interface MerchantProductDto {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceVnd: number;
  imageUrl: string | null;
  isAvailable: boolean;
  optionGroupCount: number;
}

export interface MerchantCategoryDto {
  id: string;
  name: string;
  isActive: boolean;
  products: MerchantProductDto[];
}

export interface MerchantCatalogDto {
  categories: MerchantCategoryDto[];
}

export interface MediaUploadDto {
  id: string;
  url: string;
  contentType: string;
  byteSize: number;
}
