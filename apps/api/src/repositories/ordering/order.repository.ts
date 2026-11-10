import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, In, IsNull, type FindOptionsWhere } from "typeorm";
import { OrderItem } from "../../entities/ordering/order-item.entity.js";
import { Order, OrderStatus } from "../../entities/ordering/order.entity.js";

/** Orders a driver still has to finish; a driver holds at most one. */
export const DRIVER_ACTIVE_STATUSES = [
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.PICKED_UP
];

/** Orders a driver may claim: confirmed by the store, not yet collected. */
export const CLAIMABLE_STATUSES = [
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP
];

const TIMESTAMP_COLUMN: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.ACCEPTED]: "accepted_at",
  [OrderStatus.PREPARING]: "preparing_at",
  [OrderStatus.READY_FOR_PICKUP]: "ready_at",
  [OrderStatus.PICKED_UP]: "picked_up_at",
  [OrderStatus.DELIVERED]: "delivered_at",
  [OrderStatus.REJECTED]: "closed_at",
  [OrderStatus.CANCELLED]: "closed_at"
};

export type NewOrder = Omit<
  Order,
  | "id"
  | "code"
  | "store"
  | "items"
  | "updatedAt"
  | "driverUserId"
  | "acceptedAt"
  | "preparingAt"
  | "readyAt"
  | "assignedAt"
  | "pickedUpAt"
  | "deliveredAt"
  | "closedAt"
  | "rejectReason"
  | "placedAt"
>;

export type NewOrderItem = Omit<OrderItem, "id" | "orderId" | "order">;

export interface TransitionScope {
  storeId?: string;
  driverUserId?: string;
  customerUserId?: string;
}

function isUniqueViolation(error: unknown, constraint: string): boolean {
  const driverError = (
    error as { driverError?: { code?: string; constraint?: string } }
  ).driverError;
  return driverError?.code === "23505" && driverError.constraint === constraint;
}

@Injectable()
export class OrderRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  private find(where: FindOptionsWhere<Order>) {
    return this.db.getRepository(Order).findOne({
      where,
      relations: { store: true, items: true },
      order: { items: { position: "ASC" } }
    });
  }

  findForCustomer(id: string, customerUserId: string) {
    return this.find({ id, customerUserId });
  }

  findByIdempotencyKey(customerUserId: string, idempotencyKey: string) {
    return this.find({ customerUserId, idempotencyKey });
  }

  findById(id: string) {
    return this.find({ id });
  }

  findForStore(id: string, storeId: string) {
    return this.find({ id, storeId });
  }

  findForDriver(id: string, driverUserId: string) {
    return this.find({ id, driverUserId });
  }

  findClaimable(id: string) {
    return this.find({
      id,
      driverUserId: IsNull(),
      status: In(CLAIMABLE_STATUSES)
    });
  }

  private list(
    where: FindOptionsWhere<Order>,
    limit: number,
    newestFirst = true
  ) {
    return this.db.getRepository(Order).find({
      where,
      relations: { store: true, items: true },
      order: {
        placedAt: newestFirst ? "DESC" : "ASC",
        items: { position: "ASC" }
      },
      take: limit
    });
  }

  listForCustomer(customerUserId: string, limit: number) {
    return this.list({ customerUserId }, limit);
  }

  listForStore(
    storeId: string,
    statuses: OrderStatus[],
    limit: number,
    newestFirst: boolean
  ) {
    return this.list({ storeId, status: In(statuses) }, limit, newestFirst);
  }

  listClaimable(limit: number) {
    return this.list(
      { driverUserId: IsNull(), status: In(CLAIMABLE_STATUSES) },
      limit,
      false
    );
  }

  listForDriver(driverUserId: string, statuses: OrderStatus[], limit: number) {
    return this.list({ driverUserId, status: In(statuses) }, limit);
  }

  /**
   * Inserts an order and its lines atomically. Returns null when the same
   * idempotency key was used concurrently, so the caller can return that order.
   */
  async create(
    order: NewOrder,
    items: NewOrderItem[],
    createCode: () => string
  ): Promise<string | null> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.db.transaction(async (manager) => {
          const saved = await manager
            .getRepository(Order)
            .save(
              manager
                .getRepository(Order)
                .create({ ...order, code: createCode() })
            );
          await manager
            .getRepository(OrderItem)
            .save(
              items.map((item) =>
                manager
                  .getRepository(OrderItem)
                  .create({ ...item, orderId: saved.id })
              )
            );
          return saved.id;
        });
      } catch (error) {
        if (isUniqueViolation(error, "UQ_orders_customer_idempotency"))
          return null;
        if (!isUniqueViolation(error, "UQ_orders_code")) throw error;
      }
    }
    throw new Error("Could not allocate a unique order code.");
  }

  /**
   * Moves an order from one of `from` to `to` in a single conditional UPDATE,
   * so concurrent actors cannot both succeed. Returns whether this call won.
   */
  async transition(
    id: string,
    from: OrderStatus[],
    to: OrderStatus,
    scope: TransitionScope,
    extra: { rejectReason?: string } = {}
  ): Promise<boolean> {
    const stamp = TIMESTAMP_COLUMN[to];
    const query = this.db
      .createQueryBuilder()
      .update(Order)
      .set({
        status: to,
        ...(extra.rejectReason ? { rejectReason: extra.rejectReason } : {}),
        ...(stamp ? { [this.property(stamp)]: () => "now()" } : {})
      })
      .where("id = :id AND status IN (:...from)", { id, from });
    if (scope.storeId) query.andWhere("store_id = :storeId", scope);
    if (scope.customerUserId)
      query.andWhere("customer_user_id = :customerUserId", scope);
    if (scope.driverUserId)
      query.andWhere("driver_user_id = :driverUserId", scope);
    const result = await query.execute();
    return result.affected === 1;
  }

  /**
   * Claims a delivery for a driver. The row-level `driver_user_id IS NULL`
   * guard means exactly one concurrent claim can win; a driver with an
   * unfinished delivery cannot claim another.
   */
  async claim(id: string, driverUserId: string): Promise<boolean> {
    return this.db.transaction(async (manager) => {
      // Serialises one driver's claims so two taps cannot win two orders.
      await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        driverUserId
      ]);
      const result = await manager
        .createQueryBuilder()
        .update(Order)
        .set({ driverUserId, assignedAt: () => "now()" })
        .where(
          `id = :id AND driver_user_id IS NULL AND status IN (:...claimable)
         AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.driver_user_id = :driverUserId AND o.status IN (:...active))`,
          {
            id,
            driverUserId,
            claimable: CLAIMABLE_STATUSES,
            active: DRIVER_ACTIVE_STATUSES
          }
        )
        .execute();
      return result.affected === 1;
    });
  }

  private property(column: string): keyof Order {
    return column.replace(/_([a-z])/g, (_, letter: string) =>
      letter.toUpperCase()
    ) as keyof Order;
  }
}
