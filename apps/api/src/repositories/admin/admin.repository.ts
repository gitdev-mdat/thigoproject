import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import type {
  OrderListQuery,
  StoreListQuery,
  UserListQuery
} from "../../dto/admin/admin.dto.js";
import { OrderStatus } from "../../entities/ordering/order.entity.js";

/** Operations reporting uses Vietnam's calendar day. */
export const ADMIN_TIMEZONE = "Asia/Ho_Chi_Minh";

/** Orders still moving through the store or the driver. */
export const ADMIN_ACTIVE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.PICKED_UP
];

export interface CountRow {
  key: string;
  count: number;
}

export interface OrderRowRecord {
  id: string;
  code: string;
  status: OrderStatus;
  store_id: string;
  store_name: string;
  customer_phone: string;
  driver_phone: string | null;
  item_count: number;
  total_vnd: number;
  placed_at: Date;
  updated_at: Date;
}

export interface StoreRowRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  address_line: string;
  phone: string | null;
  owner_phone: string;
  is_active: boolean;
  is_accepting_orders: boolean;
  product_count: number;
  available_product_count: number;
  active_orders: number;
  delivered_orders: number;
  delivered_value_vnd: number;
  created_at: Date;
}

export interface UserRowRecord {
  id: string;
  phone: string;
  roles: string[];
  is_active: boolean;
  store_name: string | null;
  customer_orders: number;
  last_sign_in_at: Date | null;
  created_at: Date;
}

export interface DriverRowRecord {
  id: string;
  phone: string;
  is_active: boolean;
  current_code: string | null;
  current_status: OrderStatus | null;
  current_store_name: string | null;
  delivered_count: number;
  delivered_value_vnd: number;
  last_delivered_at: Date | null;
  created_at: Date;
}

export interface OverviewTotalsRecord {
  users: number;
  new_users_7d: number;
  stores: number;
  published_stores: number;
  accepting_stores: number;
  merchants_without_store: number;
  products: number;
  available_products: number;
  categories: number;
  orders: number;
  active_orders: number;
  placed_24h: number;
  delivered_7d: number;
  delivered_value_7d: number;
  delivered_prev_7d: number;
  delivered_value_prev_7d: number;
  drivers: number;
  drivers_on_delivery: number;
}

export interface DailyRecord {
  date: string;
  placed: number;
  delivered: number;
}

export interface TopStoreRecord {
  id: string;
  name: string;
  category: string;
  delivered_orders: number;
  delivered_value_vnd: number;
}

/** Escapes LIKE wildcards so a search term only ever matches literally. */
export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
}

const ORDER_ROW_SELECT = `
  SELECT o.id, o.code, o.status, s.id AS store_id, s.name AS store_name,
         o.customer_phone, d.phone AS driver_phone,
         (SELECT COALESCE(SUM(i.quantity), 0)::int FROM order_items i WHERE i.order_id = o.id) AS item_count,
         o.total_vnd, o.placed_at, o.updated_at
    FROM orders o
    JOIN stores s ON s.id = o.store_id
    LEFT JOIN users d ON d.id = o.driver_user_id`;

/** Read-only reporting queries for the admin web. Nothing here writes. */
@Injectable()
export class AdminRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async overviewTotals(): Promise<OverviewTotalsRecord> {
    const [row] = (await this.db.query(
      `SELECT
         (SELECT COUNT(*) FROM users)::int AS users,
         (SELECT COUNT(*) FROM users WHERE created_at >= now() - interval '7 days')::int AS new_users_7d,
         (SELECT COUNT(*) FROM stores)::int AS stores,
         (SELECT COUNT(*) FROM stores WHERE is_active)::int AS published_stores,
         (SELECT COUNT(*) FROM stores WHERE is_active AND is_accepting_orders)::int AS accepting_stores,
         (SELECT COUNT(*) FROM user_roles r WHERE r.role = 'MERCHANT'
            AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.owner_user_id = r.user_id))::int AS merchants_without_store,
         (SELECT COUNT(*) FROM products WHERE archived_at IS NULL)::int AS products,
         (SELECT COUNT(*) FROM products WHERE archived_at IS NULL AND is_available)::int AS available_products,
         (SELECT COUNT(*) FROM menu_categories)::int AS categories,
         (SELECT COUNT(*) FROM orders)::int AS orders,
         (SELECT COUNT(*) FROM orders WHERE status = ANY($1))::int AS active_orders,
         (SELECT COUNT(*) FROM orders WHERE placed_at >= now() - interval '24 hours')::int AS placed_24h,
         (SELECT COUNT(*) FROM orders WHERE status = 'DELIVERED' AND delivered_at >= now() - interval '7 days')::int AS delivered_7d,
         (SELECT COALESCE(SUM(total_vnd), 0) FROM orders WHERE status = 'DELIVERED' AND delivered_at >= now() - interval '7 days')::bigint AS delivered_value_7d,
         (SELECT COUNT(*) FROM orders WHERE status = 'DELIVERED' AND delivered_at >= now() - interval '14 days' AND delivered_at < now() - interval '7 days')::int AS delivered_prev_7d,
         (SELECT COALESCE(SUM(total_vnd), 0) FROM orders WHERE status = 'DELIVERED' AND delivered_at >= now() - interval '14 days' AND delivered_at < now() - interval '7 days')::bigint AS delivered_value_prev_7d,
         (SELECT COUNT(*) FROM user_roles WHERE role = 'DRIVER')::int AS drivers,
         (SELECT COUNT(DISTINCT driver_user_id) FROM orders WHERE driver_user_id IS NOT NULL AND status = ANY($2))::int AS drivers_on_delivery`,
      [ADMIN_ACTIVE_STATUSES, ADMIN_ACTIVE_STATUSES]
    )) as OverviewTotalsRecord[];
    return row!;
  }

  usersByRole(): Promise<CountRow[]> {
    return this.db.query(
      `SELECT role::text AS key, COUNT(*)::int AS count FROM user_roles GROUP BY role`
    );
  }

  storesByCategory(): Promise<CountRow[]> {
    return this.db.query(
      `SELECT category::text AS key, COUNT(*)::int AS count FROM stores GROUP BY category`
    );
  }

  ordersByStatus(): Promise<CountRow[]> {
    return this.db.query(
      `SELECT status::text AS key, COUNT(*)::int AS count FROM orders GROUP BY status`
    );
  }

  /** One row per calendar day (oldest first), including days with no orders. */
  daily(days: number): Promise<DailyRecord[]> {
    return this.db.query(
      `WITH span AS (
         SELECT generate_series(
           (now() AT TIME ZONE $1)::date - ($2::int - 1),
           (now() AT TIME ZONE $1)::date,
           interval '1 day'
         )::date AS day
       )
       SELECT to_char(span.day, 'YYYY-MM-DD') AS date,
              (SELECT COUNT(*) FROM orders o WHERE (o.placed_at AT TIME ZONE $1)::date = span.day)::int AS placed,
              (SELECT COUNT(*) FROM orders o WHERE o.status = 'DELIVERED' AND (o.delivered_at AT TIME ZONE $1)::date = span.day)::int AS delivered
         FROM span ORDER BY span.day`,
      [ADMIN_TIMEZONE, days]
    );
  }

  topStores(limit: number): Promise<TopStoreRecord[]> {
    return this.db.query(
      `SELECT s.id, s.name, s.category::text AS category,
              COUNT(o.id)::int AS delivered_orders,
              COALESCE(SUM(o.total_vnd), 0)::bigint AS delivered_value_vnd
         FROM stores s
         JOIN orders o ON o.store_id = s.id AND o.status = 'DELIVERED'
        GROUP BY s.id
        ORDER BY delivered_value_vnd DESC, s.name
        LIMIT $1`,
      [limit]
    );
  }

  async orders(
    query: OrderListQuery
  ): Promise<{ rows: OrderRowRecord[]; total: number }> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (query.status) {
      params.push(query.status);
      where.push(`o.status = $${params.length}`);
    }
    if (query.q) {
      params.push(likePattern(query.q));
      where.push(
        `(o.code ILIKE $${params.length} OR s.name ILIKE $${params.length} OR o.customer_phone ILIKE $${params.length})`
      );
    }
    const filter = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const total = await this.count(
      `SELECT COUNT(*)::int AS total FROM orders o JOIN stores s ON s.id = o.store_id ${filter}`,
      params
    );
    const rows = (await this.db.query(
      `${ORDER_ROW_SELECT} ${filter}
        ORDER BY o.placed_at DESC, o.id
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, query.pageSize, (query.page - 1) * query.pageSize]
    )) as OrderRowRecord[];
    return { rows, total };
  }

  async stores(
    query: StoreListQuery
  ): Promise<{ rows: StoreRowRecord[]; total: number }> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (query.visibility)
      where.push(
        query.visibility === "published" ? "s.is_active" : "NOT s.is_active"
      );
    if (query.category) {
      params.push(query.category);
      where.push(`s.category = $${params.length}`);
    }
    if (query.q) {
      params.push(likePattern(query.q));
      where.push(
        `(s.name ILIKE $${params.length} OR s.address_line ILIKE $${params.length})`
      );
    }
    const filter = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const total = await this.count(
      `SELECT COUNT(*)::int AS total FROM stores s ${filter}`,
      params
    );
    params.push(ADMIN_ACTIVE_STATUSES);
    const active = params.length;
    const rows = (await this.db.query(
      `SELECT s.id, s.name, s.slug, s.category::text AS category, s.address_line,
              s.phone, u.phone AS owner_phone, s.is_active, s.is_accepting_orders,
              (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id AND p.archived_at IS NULL)::int AS product_count,
              (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id AND p.archived_at IS NULL AND p.is_available)::int AS available_product_count,
              (SELECT COUNT(*) FROM orders o WHERE o.store_id = s.id AND o.status = ANY($${active}))::int AS active_orders,
              (SELECT COUNT(*) FROM orders o WHERE o.store_id = s.id AND o.status = 'DELIVERED')::int AS delivered_orders,
              (SELECT COALESCE(SUM(o.total_vnd), 0) FROM orders o WHERE o.store_id = s.id AND o.status = 'DELIVERED')::bigint AS delivered_value_vnd,
              s.created_at
         FROM stores s
         JOIN users u ON u.id = s.owner_user_id
         ${filter}
        ORDER BY s.is_active DESC, s.name, s.id
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, query.pageSize, (query.page - 1) * query.pageSize]
    )) as StoreRowRecord[];
    return { rows, total };
  }

  async users(
    query: UserListQuery
  ): Promise<{ rows: UserRowRecord[]; total: number }> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (query.role) {
      params.push(query.role);
      where.push(
        `EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role = $${params.length})`
      );
    }
    if (query.q) {
      params.push(likePattern(query.q.replace(/\s+/g, "")));
      where.push(`u.phone ILIKE $${params.length}`);
    }
    const filter = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const total = await this.count(
      `SELECT COUNT(*)::int AS total FROM users u ${filter}`,
      params
    );
    const rows = (await this.db.query(
      `SELECT u.id, u.phone, u.is_active, u.created_at,
              ARRAY(SELECT r.role::text FROM user_roles r WHERE r.user_id = u.id ORDER BY r.role) AS roles,
              (SELECT s.name FROM stores s WHERE s.owner_user_id = u.id) AS store_name,
              (SELECT COUNT(*) FROM orders o WHERE o.customer_user_id = u.id)::int AS customer_orders,
              (SELECT MAX(x.created_at) FROM sessions x WHERE x.user_id = u.id) AS last_sign_in_at
         FROM users u
         ${filter}
        ORDER BY u.created_at DESC, u.phone
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, query.pageSize, (query.page - 1) * query.pageSize]
    )) as UserRowRecord[];
    return { rows, total };
  }

  async drivers(query: {
    page: number;
    pageSize: number;
  }): Promise<{ rows: DriverRowRecord[]; total: number }> {
    const total = await this.count(
      `SELECT COUNT(*)::int AS total FROM user_roles WHERE role = 'DRIVER'`
    );
    const rows = (await this.db.query(
      `SELECT u.id, u.phone, u.is_active, u.created_at,
              cur.code AS current_code, cur.status AS current_status, cur.store_name AS current_store_name,
              (SELECT COUNT(*) FROM orders o WHERE o.driver_user_id = u.id AND o.status = 'DELIVERED')::int AS delivered_count,
              (SELECT COALESCE(SUM(o.total_vnd), 0) FROM orders o WHERE o.driver_user_id = u.id AND o.status = 'DELIVERED')::bigint AS delivered_value_vnd,
              (SELECT MAX(o.delivered_at) FROM orders o WHERE o.driver_user_id = u.id AND o.status = 'DELIVERED') AS last_delivered_at
         FROM users u
         JOIN user_roles r ON r.user_id = u.id AND r.role = 'DRIVER'
         LEFT JOIN LATERAL (
           SELECT o.code, o.status, s.name AS store_name
             FROM orders o JOIN stores s ON s.id = o.store_id
            WHERE o.driver_user_id = u.id AND o.status = ANY($1)
            ORDER BY o.placed_at DESC LIMIT 1
         ) cur ON true
        ORDER BY (cur.code IS NULL), u.phone
        LIMIT $2 OFFSET $3`,
      [ADMIN_ACTIVE_STATUSES, query.pageSize, (query.page - 1) * query.pageSize]
    )) as DriverRowRecord[];
    return { rows, total };
  }

  private async count(sql: string, params: unknown[] = []): Promise<number> {
    const rows = (await this.db.query(sql, params)) as { total: number }[];
    return Number(rows[0]?.total ?? 0);
  }

  recentOrders(limit: number): Promise<OrderRowRecord[]> {
    return this.db.query(
      `${ORDER_ROW_SELECT} ORDER BY o.placed_at DESC, o.id LIMIT $1`,
      [limit]
    );
  }
}
