import { BadRequestException } from "@nestjs/common";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import { StoreCategory } from "../../entities/catalog/store.entity.js";
import { MerchantApplicationStatus } from "../../entities/merchant/merchant-application.entity.js";
import { OrderStatus } from "../../entities/ordering/order.entity.js";

export const ADMIN_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_MAX_PAGE_SIZE = 100;
/** Keeps OFFSET bounded; deeper history needs filters, not paging. */
export const ADMIN_MAX_PAGE = 1000;

function invalid(message = "Tham số không hợp lệ."): never {
  throw new BadRequestException(message);
}

function single(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") invalid();
  return value;
}

function positiveInteger(value: unknown, fallback: number, max: number) {
  const text = single(value);
  if (text === undefined || text === "") return fallback;
  if (!/^\d{1,6}$/.test(text)) invalid();
  const parsed = Number(text);
  if (parsed < 1 || parsed > max) invalid();
  return parsed;
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | undefined {
  const text = single(value);
  if (text === undefined || text === "") return undefined;
  if (!allowed.includes(text as T)) invalid();
  return text as T;
}

function search(value: unknown): string | undefined {
  const text = single(value)?.trim();
  if (!text) return undefined;
  if (text.length > 80) invalid("Từ khóa tối đa 80 ký tự.");
  return text;
}

export interface PageQuery {
  page: number;
  pageSize: number;
}

export function parsePage(query: Record<string, unknown>): PageQuery {
  return {
    page: positiveInteger(query.page, 1, ADMIN_MAX_PAGE),
    pageSize: positiveInteger(
      query.pageSize,
      ADMIN_DEFAULT_PAGE_SIZE,
      ADMIN_MAX_PAGE_SIZE
    )
  };
}

export interface OrderListQuery extends PageQuery {
  status?: OrderStatus | undefined;
  q?: string | undefined;
}

export function parseOrderListQuery(
  query: Record<string, unknown>
): OrderListQuery {
  return {
    ...parsePage(query),
    status: oneOf(query.status, Object.values(OrderStatus)),
    q: search(query.q)
  };
}

export const STORE_VISIBILITY = ["published", "hidden"] as const;
export type StoreVisibility = (typeof STORE_VISIBILITY)[number];

export interface StoreListQuery extends PageQuery {
  visibility?: StoreVisibility | undefined;
  category?: StoreCategory | undefined;
  q?: string | undefined;
}

export function parseStoreListQuery(
  query: Record<string, unknown>
): StoreListQuery {
  return {
    ...parsePage(query),
    visibility: oneOf(query.visibility, STORE_VISIBILITY),
    category: oneOf(query.category, Object.values(StoreCategory)),
    q: search(query.q)
  };
}

export interface UserListQuery extends PageQuery {
  role?: ApplicationRole | undefined;
  q?: string | undefined;
}

export function parseUserListQuery(
  query: Record<string, unknown>
): UserListQuery {
  return {
    ...parsePage(query),
    role: oneOf(query.role, Object.values(ApplicationRole)),
    q: search(query.q)
  };
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminOrderRow {
  id: string;
  code: string;
  status: OrderStatus;
  store: { id: string; name: string };
  customerPhone: string;
  driverPhone: string | null;
  itemCount: number;
  totalVnd: number;
  placedAt: string;
  updatedAt: string;
}

export interface AdminStoreRow {
  id: string;
  name: string;
  slug: string;
  category: StoreCategory;
  addressLine: string;
  phone: string | null;
  ownerPhone: string;
  isPublished: boolean;
  isAcceptingOrders: boolean;
  productCount: number;
  availableProductCount: number;
  activeOrders: number;
  deliveredOrders: number;
  deliveredValueVnd: number;
  createdAt: string;
}

export interface AdminUserRow {
  id: string;
  phone: string;
  roles: ApplicationRole[];
  isActive: boolean;
  storeName: string | null;
  customerOrders: number;
  lastSignInAt: string | null;
  createdAt: string;
}

export interface AdminDriverRow {
  id: string;
  phone: string;
  isActive: boolean;
  currentOrder: {
    code: string;
    status: OrderStatus;
    storeName: string;
  } | null;
  deliveredCount: number;
  deliveredValueVnd: number;
  lastDeliveredAt: string | null;
  createdAt: string;
}

export interface AdminOverview {
  generatedAt: string;
  timezone: string;
  users: {
    total: number;
    newLast7Days: number;
    byRole: Record<ApplicationRole, number>;
  };
  stores: {
    total: number;
    published: number;
    hidden: number;
    acceptingOrders: number;
    merchantsWithoutStore: number;
    byCategory: Record<StoreCategory, number>;
  };
  catalog: { products: number; availableProducts: number; categories: number };
  orders: {
    total: number;
    active: number;
    placedLast24Hours: number;
    byStatus: Record<OrderStatus, number>;
  };
  delivered: {
    last7Days: { orders: number; valueVnd: number; averageVnd: number };
    previous7Days: { orders: number; valueVnd: number };
  };
  drivers: { total: number; onDelivery: number; idle: number };
  partners: { pendingReview: number };
  daily: { date: string; placed: number; delivered: number }[];
  recentOrders: AdminOrderRow[];
  topStores: {
    id: string;
    name: string;
    category: StoreCategory;
    deliveredOrders: number;
    deliveredValueVnd: number;
  }[];
}

export interface ApplicationListQuery extends PageQuery {
  status?: MerchantApplicationStatus | undefined;
  q?: string | undefined;
}

export function parseApplicationListQuery(
  query: Record<string, unknown>
): ApplicationListQuery {
  return {
    ...parsePage(query),
    status: oneOf(query.status, Object.values(MerchantApplicationStatus)),
    q: search(query.q)
  };
}
