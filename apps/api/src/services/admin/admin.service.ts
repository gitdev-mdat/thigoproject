import { Injectable, NotFoundException } from "@nestjs/common";
import { storeClosedReason } from "../../common/catalog/store-availability.js";
import { isUuid } from "../../dto/merchant/storefront.dto.js";
import { CustomerCatalogService } from "../catalog/customer-catalog.service.js";
import type {
  AdminDriverRow,
  AdminOrderRow,
  AdminOverview,
  AdminProduct,
  AdminStoreDetail,
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
  type OrderRowRecord,
  type ProductRecord
} from "../../repositories/admin/admin.repository.js";

function toAdminProduct(product: ProductRecord): AdminProduct {
  return {
    id: product.id,
    categoryId: product.category_id,
    name: product.name,
    description: product.description,
    priceVnd: Number(product.price_vnd),
    imageUrl: product.image_url,
    isAvailable: product.is_available,
    archivedAt: product.archived_at
      ? new Date(product.archived_at).toISOString()
      : null,
    updatedAt: new Date(product.updated_at).toISOString(),
    orderedQuantity: Number(product.ordered_quantity),
    optionGroups: (product.option_groups ?? []).map((group) => ({
      name: group.name,
      minSelect: group.min_select,
      maxSelect: group.max_select,
      options: group.options.map((option) => ({
        name: option.name,
        priceDeltaVnd: option.price_delta_vnd,
        isAvailable: option.is_available
      }))
    }))
  };
}

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
  constructor(
    private readonly repository: AdminRepository,
    private readonly catalog: CustomerCatalogService
  ) {}

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
        createdAt: iso(row.created_at)!,
        description: row.description,
        logoImageUrl: row.logo_image_url,
        coverImageUrl: row.cover_image_url,
        categoryCount: Number(row.category_count),
        archivedProductCount: Number(row.archived_product_count),
        applicationId: row.application_id
      }))
    );
  }

  /** Everything the merchant manages for one store, read-only. */
  async storeDetail(id: string): Promise<AdminStoreDetail> {
    const row = isUuid(id) ? await this.repository.storeDetail(id) : null;
    if (!row) throw new NotFoundException("Không tìm thấy cửa hàng.");
    const [categories, products, statuses, recent] = await Promise.all([
      this.repository.storeCategories(id),
      this.repository.storeProducts(id),
      this.repository.storeOrdersByStatus(id),
      this.repository.storeRecentOrders(id, 8)
    ]);
    const live = products.filter((product) => !product.archived_at);
    const closedReason = storeClosedReason({
      isActive: row.is_active,
      isAcceptingOrders: row.is_accepting_orders,
      openingHours: row.opening_hours
    });
    return {
      store: {
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
        createdAt: iso(row.created_at)!,
        description: row.description,
        logoImageUrl: row.logo_image_url,
        coverImageUrl: row.cover_image_url,
        categoryCount: Number(row.category_count),
        archivedProductCount: Number(row.archived_product_count),
        applicationId: row.application_id,
        openingHours: row.opening_hours,
        updatedAt: iso(row.updated_at)!,
        isOpenNow: closedReason === null,
        closedReason
      },
      owner: {
        userId: row.owner_user_id,
        phone: row.owner_phone,
        since: iso(row.owner_since)!
      },
      application:
        row.application_id && row.application_code
          ? {
              id: row.application_id,
              code: row.application_code,
              source: row.application_source ?? "SELF",
              activatedAt: iso(row.application_activated_at)
            }
          : null,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        isActive: category.is_active,
        products: live
          .filter((product) => product.category_id === category.id)
          .map(toAdminProduct)
      })),
      archivedProducts: products
        .filter((product) => product.archived_at)
        .map(toAdminProduct),
      orders: {
        byStatus: countsBy(Object.values(OrderStatus), statuses),
        recent: recent.map(toAdminOrder)
      }
    };
  }

  /** Exactly what the customer app gets for this store, or null when hidden. */
  async storeCustomerView(id: string) {
    try {
      return { visible: true as const, store: await this.catalog.store(id) };
    } catch (error) {
      if (error instanceof NotFoundException)
        return { visible: false as const, store: null };
      throw error;
    }
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
