import type { EntityManager } from "typeorm";
import {
  ApplicationRole,
  UserRole
} from "../../entities/auth/user-role.entity.js";
import { User } from "../../entities/auth/user.entity.js";
import {
  DriverProfile,
  DriverVehicleType
} from "../../entities/driver/driver-profile.entity.js";
import { Product } from "../../entities/catalog/product.entity.js";
import { Store } from "../../entities/catalog/store.entity.js";
import { CustomerAddress } from "../../entities/ordering/customer-address.entity.js";
import { OrderItem } from "../../entities/ordering/order-item.entity.js";
import {
  Order,
  OrderStatus,
  PaymentMethod
} from "../../entities/ordering/order.entity.js";
import type {
  DevelopmentOrderWriter,
  OrderHistoryFixture
} from "../../development/order-fixtures.js";

const DELIVERY_FEE_VND = 15000;

/** The forward path an order walks; terminal REJECTED/CANCELLED leave it early. */
const PROGRESSION = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.DELIVERED
];

/**
 * Lifecycle timestamps for a fixture, offset in minutes from placement, so
 * every seeded order looks as if it went through the real transitions.
 */
export function fixtureTimeline(
  status: OrderStatus,
  placedAt: Date,
  hasDriver: boolean
) {
  const at = (minutes: number) =>
    new Date(placedAt.getTime() + minutes * 60_000);
  const reached = (stage: OrderStatus) =>
    PROGRESSION.indexOf(status) >= PROGRESSION.indexOf(stage);
  return {
    acceptedAt: reached(OrderStatus.ACCEPTED) ? at(2) : null,
    preparingAt: reached(OrderStatus.PREPARING) ? at(4) : null,
    readyAt: reached(OrderStatus.READY_FOR_PICKUP) ? at(15) : null,
    assignedAt: hasDriver ? at(6) : null,
    pickedUpAt: reached(OrderStatus.PICKED_UP) ? at(18) : null,
    deliveredAt: reached(OrderStatus.DELIVERED) ? at(34) : null,
    closedAt:
      status === OrderStatus.REJECTED
        ? at(3)
        : status === OrderStatus.CANCELLED
          ? at(1)
          : null
  };
}

/** Writes development addresses and past orders inside the caller's transaction. */
export class DevelopmentOrderFixtureRepository implements DevelopmentOrderWriter {
  constructor(private readonly manager: EntityManager) {}

  async ensureAccount(phone: string, role: ApplicationRole): Promise<string> {
    await this.manager
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({ phone })
      .orIgnore()
      .execute();
    const user = await this.manager
      .getRepository(User)
      .findOneByOrFail({ phone });
    await this.manager
      .createQueryBuilder()
      .insert()
      .into(UserRole)
      .values({ userId: user.id, role })
      .orIgnore()
      .execute();
    return user.id;
  }

  async ensureDriverProfile(
    userId: string,
    displayName: string,
    vehiclePlate: string
  ): Promise<void> {
    await this.manager.getRepository(DriverProfile).upsert(
      {
        userId,
        displayName,
        vehicleType: DriverVehicleType.MOTORBIKE,
        vehiclePlate,
        lastAssignedAt: null
      },
      ["userId"]
    );
  }

  async upsertAddress(
    userId: string,
    address: {
      label: string;
      line: string;
      note: string;
      isDefault: boolean;
      latitude: number | null;
      longitude: number | null;
    }
  ) {
    const repository = this.manager.getRepository(CustomerAddress);
    const existing = await repository.findOne({
      where: { userId, label: address.label }
    });
    if (existing) {
      if (existing.latitude === null || existing.longitude === null)
        return repository.save(
          repository.merge(existing, {
            latitude: address.latitude,
            longitude: address.longitude
          })
        );
      return existing;
    }
    // Respect a default the developer chose in the app.
    const hasDefault = await repository.exists({
      where: { userId, isDefault: true }
    });
    return repository.save(
      repository.create({
        userId,
        label: address.label,
        line: address.line,
        note: address.note,
        latitude: address.latitude,
        longitude: address.longitude,
        isDefault: address.isDefault && !hasDefault
      })
    );
  }

  async ensureHistoricOrder(
    customer: { id: string; phone: string },
    driverId: string | null,
    address: {
      label: string;
      line: string;
      note: string | null;
      latitude: number | null;
      longitude: number | null;
    },
    fixture: OrderHistoryFixture
  ): Promise<void> {
    const orders = this.manager.getRepository(Order);
    const store = await this.manager
      .getRepository(Store)
      .findOneByOrFail({ slug: fixture.storeSlug });
    const existing = await orders.findOne({
      where: { customerUserId: customer.id, idempotencyKey: fixture.key }
    });
    if (existing) {
      if (
        existing.pickupLatitude === null ||
        existing.pickupLongitude === null ||
        existing.dropoffLatitude === null ||
        existing.dropoffLongitude === null
      )
        await orders.update(
          { id: existing.id },
          {
            pickupLatitude: store.pickupLatitude,
            pickupLongitude: store.pickupLongitude,
            dropoffLatitude: address.latitude,
            dropoffLongitude: address.longitude
          }
        );
      return;
    }
    const lines = [];
    for (const item of fixture.items) {
      const product = await this.manager
        .getRepository(Product)
        .findOneByOrFail({ storeId: store.id, name: item.product });
      lines.push({ product, quantity: item.quantity });
    }
    const subtotalVnd = lines.reduce(
      (sum, line) => sum + line.product.priceVnd * line.quantity,
      0
    );
    const placedAt = new Date(Date.now() - fixture.daysAgo * 86_400_000);
    // History keeps its original rule: only delivered orders had a driver.
    const driverUserId =
      fixture.customerPhone === undefined
        ? fixture.status === OrderStatus.DELIVERED
          ? driverId
          : null
        : driverId;
    const order = await orders.save(
      orders.create({
        code: `TGDEV${fixture.key.slice(-3)}`,
        customerUserId: customer.id,
        storeId: store.id,
        driverUserId,
        status: fixture.status,
        paymentMethod: PaymentMethod.COD,
        subtotalVnd,
        deliveryFeeVnd: DELIVERY_FEE_VND,
        totalVnd: subtotalVnd + DELIVERY_FEE_VND,
        customerPhone: customer.phone,
        deliveryLabel: address.label,
        deliveryLine: address.line,
        pickupLatitude: store.pickupLatitude,
        pickupLongitude: store.pickupLongitude,
        dropoffLatitude: address.latitude,
        dropoffLongitude: address.longitude,
        deliveryNote: address.note,
        customerNote: null,
        idempotencyKey: fixture.key,
        rejectReason: fixture.rejectReason ?? null,
        placedAt,
        ...fixtureTimeline(fixture.status, placedAt, driverUserId !== null)
      })
    );
    await this.manager.getRepository(OrderItem).save(
      lines.map((line, position) =>
        this.manager.getRepository(OrderItem).create({
          orderId: order.id,
          productId: line.product.id,
          productName: line.product.name,
          imageUrl: line.product.imageUrl,
          unitPriceVnd: line.product.priceVnd,
          quantity: line.quantity,
          lineTotalVnd: line.product.priceVnd * line.quantity,
          options: [],
          position
        })
      )
    );
  }
}
