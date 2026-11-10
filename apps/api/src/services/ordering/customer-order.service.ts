import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  isUuid,
  type OrderDetailDto,
  type OrderSummaryDto
} from "../../dto/ordering/ordering.dto.js";
import { OrderStatus } from "../../entities/ordering/order.entity.js";
import { AddressRepository } from "../../repositories/ordering/address.repository.js";
import { OrderRepository } from "../../repositories/ordering/order.repository.js";
import { HOME_SHORTCUTS } from "../catalog/customer-catalog.service.js";
import { toAddress } from "./address.service.js";
import { toOrderDetail, toOrderSummary } from "./order-mapper.js";

const HISTORY_LIMIT = 30;

@Injectable()
export class CustomerOrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly addresses: AddressRepository
  ) {}

  async home(userId: string) {
    const [address, recent] = await Promise.all([
      this.addresses.findDefault(userId),
      this.orders.listForCustomer(userId, 1)
    ]);
    return {
      shortcuts: HOME_SHORTCUTS,
      defaultAddress: address ? toAddress(address) : null,
      recentOrder: recent[0] ? toOrderSummary(recent[0]) : null
    };
  }

  async list(userId: string): Promise<OrderSummaryDto[]> {
    return (await this.orders.listForCustomer(userId, HISTORY_LIMIT)).map(
      toOrderSummary
    );
  }

  async detail(userId: string, id: string): Promise<OrderDetailDto> {
    const order = isUuid(id)
      ? await this.orders.findForCustomer(id, userId)
      : null;
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng.");
    return toOrderDetail(order);
  }

  /** A customer may cancel only before the store has confirmed the order. */
  async cancel(userId: string, id: string): Promise<OrderDetailDto> {
    const current = await this.detail(userId, id);
    const cancelled = await this.orders.transition(
      id,
      [OrderStatus.PENDING],
      OrderStatus.CANCELLED,
      { customerUserId: userId }
    );
    if (!cancelled)
      throw new ConflictException(
        current.status === OrderStatus.CANCELLED
          ? "Đơn đã được huỷ."
          : "Quán đã nhận đơn nên không thể huỷ nữa."
      );
    return this.detail(userId, id);
  }
}
