import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { isUuid, type DeliveryDto } from "../../dto/ordering/ordering.dto.js";
import { Order, OrderStatus } from "../../entities/ordering/order.entity.js";
import {
  DRIVER_ACTIVE_STATUSES,
  OrderRepository
} from "../../repositories/ordering/order.repository.js";
import { DispatchService } from "../driver/dispatch.service.js";
import { DispatchRepository } from "../../repositories/driver/dispatch.repository.js";
import { toDelivery } from "./order-mapper.js";

@Injectable()
export class DriverDeliveryService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly dispatchService: DispatchService,
    private readonly dispatch: DispatchRepository
  ) {}

  async overview(driverId: string) {
    const [current, offer, history] = await Promise.all([
      this.orders.listForDriver(driverId, DRIVER_ACTIVE_STATUSES, 1),
      this.dispatchService.currentOffer(driverId),
      this.orders.listForDriver(driverId, [OrderStatus.DELIVERED], 10)
    ]);
    return {
      current: current[0] ? toDelivery(current[0], true) : null,
      available: !current[0] && offer ? [offer.delivery] : [],
      history: history.map((order) => toDelivery(order, true))
    };
  }

  /** Compatibility endpoint: claiming is only allowed for the driver's active offer. */
  async claim(driverId: string, id: string): Promise<DeliveryDto> {
    if (!isUuid(id)) throw new NotFoundException("Không tìm thấy đơn.");
    const existing = await this.orders.findForDriver(id, driverId);
    if (existing) return toDelivery(existing, true);
    const offer = await this.dispatch.currentOffer(driverId);
    if (!offer || offer.orderId !== id)
      throw new ConflictException("Đơn này không nằm trong đề nghị hiện tại.");
    return this.dispatchService.accept(driverId, offer.id);
  }

  async pickUp(driverId: string, id: string): Promise<DeliveryDto> {
    const order = await this.mineOrder(driverId, id);
    if (order.status === OrderStatus.PICKED_UP) return toDelivery(order, true);
    const moved = await this.orders.transition(
      id,
      [OrderStatus.READY_FOR_PICKUP],
      OrderStatus.PICKED_UP,
      { driverUserId: driverId }
    );
    if (!moved) throw new ConflictException("Quán chưa chuẩn bị xong đơn này.");
    return toDelivery(await this.mineOrder(driverId, id), true);
  }

  async deliver(driverId: string, id: string): Promise<DeliveryDto> {
    const order = await this.mineOrder(driverId, id);
    if (order.status === OrderStatus.DELIVERED) return toDelivery(order, true);
    const moved = await this.dispatch.completeDelivery(id, driverId);
    if (!moved)
      throw new ConflictException("Hãy xác nhận lấy hàng trước khi giao.");
    return toDelivery(await this.mineOrder(driverId, id), true);
  }

  async cancel(driverId: string, id: string): Promise<DeliveryDto> {
    const order = await this.mineOrder(driverId, id);
    if (order.status === OrderStatus.PICKED_UP)
      throw new ConflictException("Không thể huỷ sau khi đã lấy hàng.");
    if (!(await this.dispatch.cancelAssignment(id, driverId)))
      throw new ConflictException("Đơn không thể được chuyển lại lúc này.");
    return toDelivery(order, true);
  }

  private async mineOrder(driverId: string, id: string): Promise<Order> {
    const order = isUuid(id)
      ? await this.orders.findForDriver(id, driverId)
      : null;
    if (!order) throw new NotFoundException("Không tìm thấy đơn.");
    return order;
  }
}
