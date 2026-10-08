import type { EntityManager } from "typeorm";
import {
  ApplicationRole,
  UserRole
} from "../../entities/auth/user-role.entity.js";
import { User } from "../../entities/auth/user.entity.js";
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

  async upsertAddress(
    userId: string,
    address: { label: string; line: string; note: string; isDefault: boolean }
  ) {
    const repository = this.manager.getRepository(CustomerAddress);
    const existing = await repository.findOne({
      where: { userId, label: address.label }
    });
    if (existing) return existing;
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
        isDefault: address.isDefault && !hasDefault
      })
    );
  }

  async ensureHistoricOrder(
    customer: { id: string; phone: string },
    driverId: string,
    address: { label: string; line: string; note: string | null },
    fixture: OrderHistoryFixture
  ): Promise<void> {
    const orders = this.manager.getRepository(Order);
    if (
      await orders.exists({
        where: { customerUserId: customer.id, idempotencyKey: fixture.key }
      })
    )
      return;
    const store = await this.manager
      .getRepository(Store)
      .findOneByOrFail({ slug: fixture.storeSlug });
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
    const at = (minutes: number) =>
      new Date(placedAt.getTime() + minutes * 60_000);
    const delivered = fixture.status === OrderStatus.DELIVERED;
    const order = await orders.save(
      orders.create({
        code: `TGDEV${fixture.key.slice(-3)}`,
        customerUserId: customer.id,
        storeId: store.id,
        driverUserId: delivered ? driverId : null,
        status: fixture.status,
        paymentMethod: PaymentMethod.COD,
        subtotalVnd,
        deliveryFeeVnd: DELIVERY_FEE_VND,
        totalVnd: subtotalVnd + DELIVERY_FEE_VND,
        customerPhone: customer.phone,
        deliveryLabel: address.label,
        deliveryLine: address.line,
        deliveryNote: address.note,
        customerNote: null,
        idempotencyKey: fixture.key,
        rejectReason: fixture.rejectReason ?? null,
        placedAt,
        acceptedAt: delivered ? at(2) : null,
        preparingAt: delivered ? at(4) : null,
        readyAt: delivered ? at(15) : null,
        assignedAt: delivered ? at(6) : null,
        pickedUpAt: delivered ? at(18) : null,
        deliveredAt: delivered ? at(34) : null,
        closedAt: delivered ? null : at(3)
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
