import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { isUuid, type DeliveryDto } from "../../dto/ordering/ordering.dto.js";
import { OrderStatus } from "../../entities/ordering/order.entity.js";
import {
  DRIVER_ACTIVE_STATUSES,
  OrderRepository
} from "../../repositories/ordering/order.repository.js";
import { toDelivery } from "./order-mapper.js";

@Injectable()
export class DriverDeliveryService {
  constructor(private readonly orders: OrderRepository) {}

  async overview(driverId: string) {
    const [current, available, history] = await Promise.all([
      this.orders.listForDriver(driverId, DRIVER_ACTIVE_STATUSES, 1),
      this.orders.listClaimable(20),
      this.orders.listForDriver(driverId, [OrderStatus.DELIVERED], 10)
    ]);
    return {
      current: current[0] ? toDelivery(current[0], true) : null,
      available: available.map((order) => toDelivery(order, false)),
      history: history.map((order) => toDelivery(order, true))
    };
  }

  /** First driver to claim wins; the database guard rejects every later claim. */
  async claim(driverId: string, id: string): Promise<DeliveryDto> {
    if (!isUuid(id)) throw new NotFoundException("Không tìm thấy đơn.");
    if (!(await this.orders.claim(id, driverId))) {
      const active = await this.orders.listForDriver(
        driverId,
        DRIVER_ACTIVE_STATUSES,
        1
      );
      throw new ConflictException(
        active[0] && active[0].id !== id
          ? "Bạn đang có một đơn chưa hoàn tất."
          : "Đơn này đã có tài xế khác nhận."
      );
    }
    return this.mine(driverId, id);
  }

  async pickUp(driverId: string, id: string): Promise<DeliveryDto> {
    const order = await this.mine(driverId, id);
    const moved = await this.orders.transition(
      id,
      [OrderStatus.READY_FOR_PICKUP],
      OrderStatus.PICKED_UP,
      { driverUserId: driverId }
    );
    if (!moved)
      throw new ConflictException(
        order.status === OrderStatus.PICKED_UP
          ? "Bạn đã xác nhận lấy hàng."
          : "Quán chưa chuẩn bị xong đơn này."
      );
    return this.mine(driverId, id);
  }

  async deliver(driverId: string, id: string): Promise<DeliveryDto> {
    const order = await this.mine(driverId, id);
    const moved = await this.orders.transition(
      id,
      [OrderStatus.PICKED_UP],
      OrderStatus.DELIVERED,
      { driverUserId: driverId }
    );
    if (!moved)
      throw new ConflictException(
        order.status === OrderStatus.DELIVERED
          ? "Đơn đã được giao."
          : "Hãy xác nhận lấy hàng trước khi giao."
      );
    return this.mine(driverId, id);
  }

  private async mine(driverId: string, id: string): Promise<DeliveryDto> {
    const order = isUuid(id)
      ? await this.orders.findForDriver(id, driverId)
      : null;
    if (!order) throw new NotFoundException("Không tìm thấy đơn.");
    return toDelivery(order, true);
  }
}
