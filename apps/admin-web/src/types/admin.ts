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

export type ApplicationStatus =
  "DRAFT" | "PENDING_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";

export interface MerchantApplication {
  id: string;
  code: string;
  status: ApplicationStatus;
  source: "SELF" | "ADMIN";
  accountPhone: string;
  storeName: string;
  category: StoreCategory;
  contactPhone: string;
  addressLine: string;
  description: string | null;
  contactName: string;
  reviewNote: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  activatedAt: string | null;
  storeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationPage extends Page<MerchantApplication> {
  byStatus: Record<ApplicationStatus, number>;
}

export interface ApplicationEvent {
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  action: string;
  note: string | null;
  actorKind: "applicant" | "admin";
  actorPhone?: string;
  createdAt: string;
}

export interface ApplicationDetail {
  application: MerchantApplication;
  applicant: {
    userId: string | null;
    hasAccount: boolean;
    roles: Role[];
    hasStore: boolean;
  };
  store: { id: string; name: string; isPublished: boolean } | null;
  history: ApplicationEvent[];
}

export interface PartnerInput {
  accountPhone: string;
  contactName: string;
  storeName: string;
  category: StoreCategory;
  contactPhone: string;
  addressLine: string;
  description?: string;
}
