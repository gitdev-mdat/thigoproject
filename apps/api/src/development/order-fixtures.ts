import { canonicalizeVietnamesePhone } from "../common/auth/phone-number.js";
import { ApplicationRole } from "../entities/auth/user-role.entity.js";
import { OrderStatus } from "../entities/ordering/order.entity.js";

export const DEVELOPMENT_CUSTOMER_PHONE = "0860000001";
export const DEVELOPMENT_DRIVER_PHONE = "0860000003";
/** A second driver so "two drivers, one delivery" can be exercised locally. */
export const DEVELOPMENT_EXTRA_DRIVER_PHONE = "0860000201";

/**
 * Extra accounts that give the admin dashboard realistic activity. None of
 * them is a regression login: Customer 0860000001, Merchant 0860000002 and
 * Drivers 0860000003/0860000201 keep their live queues empty.
 */
export const DEVELOPMENT_ACTIVITY_CUSTOMER_PHONES = [
  "0860000011",
  "0860000012",
  "0860000013",
  "0860000014"
] as const;
export const DEVELOPMENT_ACTIVITY_DRIVER_PHONES = [
  "0860000202",
  "0860000203",
  "0860000204",
  "0860000205"
] as const;

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

export const DEVELOPMENT_ACTIVITY_ADDRESSES = [
  {
    label: "Nhà",
    line: "48 Lý Tự Trọng, P. Bến Nghé, Q.1, TP. Hồ Chí Minh",
    note: "Nhà có cổng xanh",
    isDefault: true
  },
  {
    label: "Nhà",
    line: "210 Điện Biên Phủ, P.7, Q.3, TP. Hồ Chí Minh",
    note: "Gọi khi tới hẻm",
    isDefault: true
  },
  {
    label: "Nhà",
    line: "15 Nguyễn Hữu Cảnh, P.22, Q. Bình Thạnh, TP. Hồ Chí Minh",
    note: "Gửi bảo vệ sảnh B",
    isDefault: true
  },
  {
    label: "Nhà",
    line: "92 Phan Xích Long, P.2, Q. Phú Nhuận, TP. Hồ Chí Minh",
    note: "Giao trước 21:00",
    isDefault: true
  }
];

export interface OrderHistoryFixture {
  /** Idempotency key; its last three characters form the order code. */
  key: string;
  storeSlug: string;
  status: OrderStatus;
  /** Age of the order; fractions of a day are allowed. */
  daysAgo: number;
  items: { product: string; quantity: number }[];
  rejectReason?: string;
  /** Owner of an activity order; history defaults to the regression customer. */
  customerPhone?: string;
  /** Driver of an activity order; history defaults to the regression driver. */
  driverPhone?: string;
}

/** The regression customer's past orders; live order queues start empty. */
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

const H = 1 / 24;
const [C1, C2, C3, C4] = DEVELOPMENT_ACTIVITY_CUSTOMER_PHONES;
const [D1, D2, D3, D4] = DEVELOPMENT_ACTIVITY_DRIVER_PHONES;

/**
 * Two weeks of activity for the admin dashboard, owned by the activity
 * accounts. Every order that is still moving and could be claimed already has
 * an activity driver, so no regression driver sees an extra job, and none is
 * at Cơm Tấm Sài Gòn, so the regression merchant's queue stays empty.
 */
export const DEVELOPMENT_ACTIVITY_ORDERS: OrderHistoryFixture[] = [
  {
    key: "dev-seed-activity-0004",
    storeSlug: "pho-ha-thanh",
    status: OrderStatus.DELIVERED,
    daysAgo: 13 + 5 * H,
    customerPhone: C1,
    driverPhone: D1,
    items: [
      { product: "Phở tái chín", quantity: 2 },
      { product: "Gỏi cuốn tôm thịt", quantity: 1 }
    ]
  },
  {
    key: "dev-seed-activity-0005",
    storeSlug: "banh-mi-co-ba",
    status: OrderStatus.DELIVERED,
    daysAgo: 12 + 9 * H,
    customerPhone: C2,
    driverPhone: D2,
    items: [{ product: "Bánh mì đặc biệt", quantity: 3 }]
  },
  {
    key: "dev-seed-activity-0006",
    storeSlug: "tra-sua-may",
    status: OrderStatus.CANCELLED,
    daysAgo: 12 + 2 * H,
    customerPhone: C3,
    items: [{ product: "Trà vải hoa hồng", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0007",
    storeSlug: "bun-bo-hue-1989",
    status: OrderStatus.DELIVERED,
    daysAgo: 11 + 4 * H,
    customerPhone: C4,
    driverPhone: D3,
    items: [
      { product: "Bún bò đặc biệt", quantity: 1 },
      { product: "Chả giò tôm thịt", quantity: 1 }
    ]
  },
  {
    key: "dev-seed-activity-0008",
    storeSlug: "the-phin-corner",
    status: OrderStatus.DELIVERED,
    daysAgo: 10 + 7 * H,
    customerPhone: C1,
    driverPhone: D4,
    items: [{ product: "Cold brew cam sả", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0009",
    storeSlug: "tiem-tra-lai",
    status: OrderStatus.DELIVERED,
    daysAgo: 9 + 3 * H,
    customerPhone: C2,
    driverPhone: D1,
    items: [
      { product: "Trà sữa lài", quantity: 2 },
      { product: "Hồng trà sữa", quantity: 1 }
    ]
  },
  {
    key: "dev-seed-activity-0010",
    storeSlug: "pho-ha-thanh",
    status: OrderStatus.REJECTED,
    daysAgo: 8 + 6 * H,
    customerPhone: C3,
    rejectReason: "Quán tạm đóng bếp để vệ sinh.",
    items: [{ product: "Phở bò viên", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0011",
    storeSlug: "ca-phe-sua-da-1975",
    status: OrderStatus.DELIVERED,
    daysAgo: 7 + 2 * H,
    customerPhone: C4,
    driverPhone: D2,
    items: [{ product: "Cà phê dừa", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0012",
    storeSlug: "bun-bo-hue-1989",
    status: OrderStatus.DELIVERED,
    daysAgo: 6 + 5 * H,
    customerPhone: C1,
    driverPhone: D3,
    items: [{ product: "Bún bò tái nạm", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0013",
    storeSlug: "tran-chau-duong-den-88",
    status: OrderStatus.DELIVERED,
    daysAgo: 5 + 8 * H,
    customerPhone: C2,
    driverPhone: D4,
    items: [{ product: "Sữa tươi trân châu đường đen", quantity: 3 }]
  },
  {
    key: "dev-seed-activity-0014",
    storeSlug: "banh-mi-co-ba",
    status: OrderStatus.DELIVERED,
    daysAgo: 4 + 3 * H,
    customerPhone: C3,
    driverPhone: D1,
    items: [
      { product: "Bún thịt nướng chả giò", quantity: 1 },
      { product: "Bánh mì thịt nướng", quantity: 2 }
    ]
  },
  {
    key: "dev-seed-activity-0015",
    storeSlug: "ca-phe-muoi-chu-long",
    status: OrderStatus.CANCELLED,
    daysAgo: 4 + 1 * H,
    customerPhone: C4,
    items: [{ product: "Bánh flan", quantity: 4 }]
  },
  {
    key: "dev-seed-activity-0016",
    storeSlug: "pho-ha-thanh",
    status: OrderStatus.DELIVERED,
    daysAgo: 3 + 4 * H,
    customerPhone: C4,
    driverPhone: D2,
    items: [{ product: "Phở đặc biệt", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0017",
    storeSlug: "tiem-tra-lai",
    status: OrderStatus.DELIVERED,
    daysAgo: 2 + 6 * H,
    customerPhone: C1,
    driverPhone: D3,
    items: [{ product: "Trà lài đác thơm", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0018",
    storeSlug: "the-phin-corner",
    status: OrderStatus.REJECTED,
    daysAgo: 2 + 2 * H,
    customerPhone: C2,
    rejectReason: "Hết sữa tươi cho món đã chọn.",
    items: [{ product: "Latte", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0019",
    storeSlug: "bun-bo-hue-1989",
    status: OrderStatus.DELIVERED,
    daysAgo: 1 + 5 * H,
    customerPhone: C3,
    driverPhone: D4,
    items: [
      { product: "Bún bò chả cua", quantity: 2 },
      { product: "Chả giò tôm thịt", quantity: 1 }
    ]
  },
  {
    key: "dev-seed-activity-0020",
    storeSlug: "tra-sua-may",
    status: OrderStatus.DELIVERED,
    daysAgo: 1 + 1 * H,
    customerPhone: C4,
    driverPhone: D1,
    items: [{ product: "Matcha latte", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0021",
    storeSlug: "banh-mi-co-ba",
    status: OrderStatus.DELIVERED,
    daysAgo: 5 * H,
    customerPhone: C1,
    driverPhone: D2,
    items: [{ product: "Bánh mì thịt nướng", quantity: 4 }]
  },
  // Still moving: one order in each remaining state, each driver holding at most one.
  {
    key: "dev-seed-activity-0101",
    storeSlug: "banh-mi-co-ba",
    status: OrderStatus.PENDING,
    daysAgo: 0.003,
    customerPhone: C2,
    items: [{ product: "Bánh mì đặc biệt", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0102",
    storeSlug: "tiem-tra-lai",
    status: OrderStatus.ACCEPTED,
    daysAgo: 0.006,
    customerPhone: C3,
    driverPhone: D1,
    items: [{ product: "Trà sữa lài", quantity: 3 }]
  },
  {
    key: "dev-seed-activity-0103",
    storeSlug: "bun-bo-hue-1989",
    status: OrderStatus.PREPARING,
    daysAgo: 0.01,
    customerPhone: C4,
    driverPhone: D2,
    items: [{ product: "Bún bò đặc biệt", quantity: 2 }]
  },
  {
    key: "dev-seed-activity-0104",
    storeSlug: "the-phin-corner",
    status: OrderStatus.READY_FOR_PICKUP,
    daysAgo: 0.014,
    customerPhone: C1,
    driverPhone: D3,
    items: [
      { product: "Cold brew cam sả", quantity: 1 },
      { product: "Latte", quantity: 1 }
    ]
  },
  {
    key: "dev-seed-activity-0105",
    storeSlug: "pho-ha-thanh",
    status: OrderStatus.PICKED_UP,
    daysAgo: 0.02,
    customerPhone: C2,
    driverPhone: D4,
    items: [
      { product: "Phở tái chín", quantity: 1 },
      { product: "Gỏi cuốn tôm thịt", quantity: 2 }
    ]
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
    driverId: string | null,
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

  const accounts = new Map<string, string>();
  const account = async (phone: string, role: ApplicationRole) => {
    const canonical = canonicalizeVietnamesePhone(phone);
    if (!accounts.has(canonical))
      accounts.set(canonical, await writer.ensureAccount(canonical, role));
    return { id: accounts.get(canonical)!, phone: canonical };
  };
  const homes = new Map<
    string,
    { label: string; line: string; note: string | null }
  >();
  for (const [index, phone] of DEVELOPMENT_ACTIVITY_CUSTOMER_PHONES.entries()) {
    const customer = await account(phone, ApplicationRole.CUSTOMER);
    homes.set(
      customer.phone,
      await writer.upsertAddress(
        customer.id,
        DEVELOPMENT_ACTIVITY_ADDRESSES[index]!
      )
    );
  }
  for (const phone of DEVELOPMENT_ACTIVITY_DRIVER_PHONES)
    await account(phone, ApplicationRole.DRIVER);
  for (const order of DEVELOPMENT_ACTIVITY_ORDERS) {
    const customer = await account(
      order.customerPhone!,
      ApplicationRole.CUSTOMER
    );
    const driver = order.driverPhone
      ? (await account(order.driverPhone, ApplicationRole.DRIVER)).id
      : null;
    await writer.ensureHistoricOrder(
      customer,
      driver,
      homes.get(customer.phone)!,
      order
    );
  }
}
