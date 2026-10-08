import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  isUuid,
  type OrderDetailDto
} from "../../dto/ordering/ordering.dto.js";
import type { Store } from "../../entities/catalog/store.entity.js";
import { OrderStatus } from "../../entities/ordering/order.entity.js";
import { CatalogRepository } from "../../repositories/catalog/catalog.repository.js";
import { OrderRepository } from "../../repositories/ordering/order.repository.js";
import { toMerchantOrder } from "./order-mapper.js";

export type MerchantAction = "accept" | "reject" | "prepare" | "ready";

/** The only moves a store can make; anything else is rejected. */
export const MERCHANT_TRANSITIONS: Record<
  MerchantAction,
  { from: OrderStatus; to: OrderStatus }
> = {
  accept: { from: OrderStatus.PENDING, to: OrderStatus.ACCEPTED },
  reject: { from: OrderStatus.PENDING, to: OrderStatus.REJECTED },
  prepare: { from: OrderStatus.ACCEPTED, to: OrderStatus.PREPARING },
  ready: { from: OrderStatus.PREPARING, to: OrderStatus.READY_FOR_PICKUP }
};

const ACTIVE = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP
];
const DONE = [
  OrderStatus.PICKED_UP,
  OrderStatus.DELIVERED,
  OrderStatus.REJECTED,
  OrderStatus.CANCELLED
];

@Injectable()
export class MerchantOrderService {
  constructor(
    private readonly catalog: CatalogRepository,
    private readonly orders: OrderRepository
  ) {}

  async store(userId: string): Promise<Store> {
    const store = await this.catalog.findStoreByOwner(userId);
    if (!store) throw new ForbiddenException("Tài khoản này chưa có cửa hàng.");
    return store;
  }

  async overview(userId: string) {
    const store = await this.store(userId);
    const [active, done] = await Promise.all([
      this.orders.listForStore(store.id, ACTIVE, 50, false),
      this.orders.listForStore(store.id, DONE, 20, true)
    ]);
    return {
      store: {
        id: store.id,
        name: store.name,
        addressLine: store.addressLine,
        isActive: store.isActive
      },
      active: active.map(toMerchantOrder),
      recent: done.map(toMerchantOrder)
    };
  }

  async act(
    userId: string,
    id: string,
    action: MerchantAction,
    rejectReason?: string
  ): Promise<OrderDetailDto> {
    const store = await this.store(userId);
    const order = isUuid(id)
      ? await this.orders.findForStore(id, store.id)
      : null;
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng.");
    const { from, to } = MERCHANT_TRANSITIONS[action];
    const moved = await this.orders.transition(
      id,
      [from],
      to,
      { storeId: store.id },
      rejectReason ? { rejectReason } : {}
    );
    if (!moved)
      throw new ConflictException(
        order.status === OrderStatus.CANCELLED
          ? "Khách đã huỷ đơn này."
          : "Đơn đã chuyển sang trạng thái khác. Danh sách đã được làm mới."
      );
    const updated = await this.orders.findForStore(id, store.id);
    if (!updated) throw new NotFoundException();
    return toMerchantOrder(updated);
  }
}
