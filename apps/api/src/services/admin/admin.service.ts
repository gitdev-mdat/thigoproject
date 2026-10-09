import { Injectable } from "@nestjs/common";
import type {
  AdminDriverRow,
  AdminOrderRow,
  AdminOverview,
  AdminStoreRow,
  AdminUserRow,
  OrderListQuery,
  Page,
  PageQuery,
  StoreListQuery,
  UserListQuery
} from "../../dto/admin/admin.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import { StoreCategory } from "../../entities/catalog/store.entity.js";
import { OrderStatus } from "../../entities/ordering/order.entity.js";
import {
  ADMIN_TIMEZONE,
  AdminRepository,
  type CountRow,
  type OrderRowRecord
} from "../../repositories/admin/admin.repository.js";

export const ADMIN_DAILY_DAYS = 14;

/** Every enum member gets a count, so a missing group reads as 0, not undefined. */
export function countsBy<T extends string>(
  keys: readonly T[],
  rows: CountRow[]
): Record<T, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<
    T,
    number
  >;
  for (const row of rows)
    if ((keys as readonly string[]).includes(row.key))
      counts[row.key as T] = Number(row.count);
  return counts;
}

const iso = (value: Date | string | null) =>
  value === null ? null : new Date(value).toISOString();

export function toAdminOrder(row: OrderRowRecord): AdminOrderRow {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    store: { id: row.store_id, name: row.store_name },
    customerPhone: row.customer_phone,
    driverPhone: row.driver_phone,
    itemCount: Number(row.item_count),
    totalVnd: Number(row.total_vnd),
    placedAt: iso(row.placed_at)!,
    updatedAt: iso(row.updated_at)!
  };
}

/** Read-only operational reporting for ADMIN users; every figure comes from PostgreSQL. */
@Injectable()
export class AdminService {
  constructor(private readonly repository: AdminRepository) {}

  async overview(): Promise<AdminOverview> {
    const [totals, roles, categories, statuses, daily, recent, top] =
      await Promise.all([
        this.repository.overviewTotals(),
        this.repository.usersByRole(),
        this.repository.storesByCategory(),
        this.repository.ordersByStatus(),
        this.repository.daily(ADMIN_DAILY_DAYS),
        this.repository.recentOrders(8),
        this.repository.topStores(5)
      ]);
    const delivered7 = Number(totals.delivered_7d);
    const value7 = Number(totals.delivered_value_7d);
    const drivers = Number(totals.drivers);
    const onDelivery = Number(totals.drivers_on_delivery);
    return {
      generatedAt: new Date().toISOString(),
      timezone: ADMIN_TIMEZONE,
      users: {
        total: Number(totals.users),
        newLast7Days: Number(totals.new_users_7d),
        byRole: countsBy(Object.values(ApplicationRole), roles)
      },
      stores: {
        total: Number(totals.stores),
        published: Number(totals.published_stores),
        hidden: Number(totals.stores) - Number(totals.published_stores),
        acceptingOrders: Number(totals.accepting_stores),
        merchantsWithoutStore: Number(totals.merchants_without_store),
        byCategory: countsBy(Object.values(StoreCategory), categories)
      },
      catalog: {
        products: Number(totals.products),
        availableProducts: Number(totals.available_products),
        categories: Number(totals.categories)
      },
      orders: {
        total: Number(totals.orders),
        active: Number(totals.active_orders),
        placedLast24Hours: Number(totals.placed_24h),
        byStatus: countsBy(Object.values(OrderStatus), statuses)
      },
      delivered: {
        last7Days: {
          orders: delivered7,
          valueVnd: value7,
          averageVnd: delivered7 ? Math.round(value7 / delivered7) : 0
        },
        previous7Days: {
          orders: Number(totals.delivered_prev_7d),
          valueVnd: Number(totals.delivered_value_prev_7d)
        }
      },
      drivers: {
        total: drivers,
        onDelivery,
        idle: Math.max(0, drivers - onDelivery)
      },
      partners: { pendingReview: Number(totals.pending_applications) },
      daily: daily.map((day) => ({
        date: day.date,
        placed: Number(day.placed),
        delivered: Number(day.delivered)
      })),
      recentOrders: recent.map(toAdminOrder),
      topStores: top.map((store) => ({
        id: store.id,
        name: store.name,
        category: store.category as StoreCategory,
        deliveredOrders: Number(store.delivered_orders),
        deliveredValueVnd: Number(store.delivered_value_vnd)
      }))
    };
  }

  async orders(query: OrderListQuery): Promise<Page<AdminOrderRow>> {
    const { rows, total } = await this.repository.orders(query);
    return this.page(query, total, rows.map(toAdminOrder));
  }

  async stores(query: StoreListQuery): Promise<Page<AdminStoreRow>> {
    const { rows, total } = await this.repository.stores(query);
    return this.page(
      query,
      total,
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category as StoreCategory,
        addressLine: row.address_line,
        phone: row.phone,
        ownerPhone: row.owner_phone,
        isPublished: row.is_active,
        isAcceptingOrders: row.is_accepting_orders,
        productCount: Number(row.product_count),
        availableProductCount: Number(row.available_product_count),
        activeOrders: Number(row.active_orders),
        deliveredOrders: Number(row.delivered_orders),
        deliveredValueVnd: Number(row.delivered_value_vnd),
        createdAt: iso(row.created_at)!
      }))
    );
  }

  async users(query: UserListQuery): Promise<Page<AdminUserRow>> {
    const { rows, total } = await this.repository.users(query);
    return this.page(
      query,
      total,
      rows.map((row) => ({
        id: row.id,
        phone: row.phone,
        roles: row.roles as ApplicationRole[],
        isActive: row.is_active,
        storeName: row.store_name,
        customerOrders: Number(row.customer_orders),
        lastSignInAt: iso(row.last_sign_in_at),
        createdAt: iso(row.created_at)!
      }))
    );
  }

  async drivers(query: PageQuery): Promise<Page<AdminDriverRow>> {
    const { rows, total } = await this.repository.drivers(query);
    return this.page(
      query,
      total,
      rows.map((row) => ({
        id: row.id,
        phone: row.phone,
        isActive: row.is_active,
        currentOrder:
          row.current_code && row.current_status && row.current_store_name
            ? {
                code: row.current_code,
                status: row.current_status,
                storeName: row.current_store_name
              }
            : null,
        deliveredCount: Number(row.delivered_count),
        deliveredValueVnd: Number(row.delivered_value_vnd),
        lastDeliveredAt: iso(row.last_delivered_at),
        createdAt: iso(row.created_at)!
      }))
    );
  }

  private page<T>(query: PageQuery, total: number, items: T[]): Page<T> {
    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total: Number(total)
    };
  }
}
