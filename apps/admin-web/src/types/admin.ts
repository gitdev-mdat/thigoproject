// Mirrors the NestJS contracts in apps/api/src/dto/admin/admin.dto.ts.

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED";

export type StoreCategory = "FOOD" | "COFFEE" | "MILK_TEA";
export type Role = "CUSTOMER" | "MERCHANT" | "DRIVER" | "ADMIN";

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
  roles: Role[];
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
  users: { total: number; newLast7Days: number; byRole: Record<Role, number> };
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
