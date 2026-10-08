import { canonicalizeVietnamesePhone } from "../common/auth/phone-number.js";
import { ApplicationRole } from "../entities/auth/user-role.entity.js";
import { OrderStatus } from "../entities/ordering/order.entity.js";

export const DEVELOPMENT_CUSTOMER_PHONE = "0860000001";
export const DEVELOPMENT_DRIVER_PHONE = "0860000003";
/** A second driver so "two drivers, one delivery" can be exercised locally. */
export const DEVELOPMENT_EXTRA_DRIVER_PHONE = "0860000201";

export const DEVELOPMENT_ADDRESSES = [
  {
    label: "Nhà",
    line: "12 Nguyễn Trãi, P. Bến Thành, Q.1, TP. Hồ Chí Minh",
    note: "Gọi trước khi giao",
    isDefault: true
  },
  {
    label: "Công ty",
    line: "75 Hai Bà Trưng, P. Bến Nghé, Q.1, TP. Hồ Chí Minh",
    note: "Gửi lễ tân tầng 1",
    isDefault: false
  }
];

export interface OrderHistoryFixture {
  key: string;
  storeSlug: string;
  status: OrderStatus.DELIVERED | OrderStatus.REJECTED;
  daysAgo: number;
  items: { product: string; quantity: number }[];
  rejectReason?: string;
}

/** Past orders only, so live order queues start empty for the regression scenario. */
export const DEVELOPMENT_ORDER_HISTORY: OrderHistoryFixture[] = [
  {
    key: "dev-seed-history-0001",
    storeSlug: "com-tam-sai-gon",
    status: OrderStatus.DELIVERED,
    daysAgo: 3,
    items: [
      { product: "Cơm tấm sườn bì chả", quantity: 2 },
      { product: "Trà đá", quantity: 2 }
    ]
  },
  {
    key: "dev-seed-history-0002",
    storeSlug: "tra-sua-may",
    status: OrderStatus.DELIVERED,
    daysAgo: 6,
    items: [{ product: "Trà sữa ô long", quantity: 1 }]
  },
  {
    key: "dev-seed-history-0003",
    storeSlug: "pho-ha-thanh",
    status: OrderStatus.REJECTED,
    daysAgo: 9,
    items: [{ product: "Phở đặc biệt", quantity: 1 }],
    rejectReason: "Quán đã hết nước dùng cho hôm nay."
  }
];

export interface DevelopmentOrderWriter {
  ensureAccount(phone: string, role: ApplicationRole): Promise<string>;
  upsertAddress(
    userId: string,
    address: (typeof DEVELOPMENT_ADDRESSES)[number]
  ): Promise<{ label: string; line: string; note: string | null }>;
  ensureHistoricOrder(
    customer: { id: string; phone: string },
    driverId: string,
    address: { label: string; line: string; note: string | null },
    fixture: OrderHistoryFixture
  ): Promise<void>;
}

export async function seedDevelopmentOrders(
  writer: DevelopmentOrderWriter
): Promise<void> {
  const customerPhone = canonicalizeVietnamesePhone(DEVELOPMENT_CUSTOMER_PHONE);
  const customerId = await writer.ensureAccount(
    customerPhone,
    ApplicationRole.CUSTOMER
  );
  const driverId = await writer.ensureAccount(
    canonicalizeVietnamesePhone(DEVELOPMENT_DRIVER_PHONE),
    ApplicationRole.DRIVER
  );
  await writer.ensureAccount(
    canonicalizeVietnamesePhone(DEVELOPMENT_EXTRA_DRIVER_PHONE),
    ApplicationRole.DRIVER
  );
  const addresses = [];
  for (const address of DEVELOPMENT_ADDRESSES)
    addresses.push(await writer.upsertAddress(customerId, address));
  for (const order of DEVELOPMENT_ORDER_HISTORY)
    await writer.ensureHistoricOrder(
      { id: customerId, phone: customerPhone },
      driverId,
      addresses[0]!,
      order
    );
}
