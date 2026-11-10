import { describe, expect, it } from "vitest";
import type { Order } from "../../entities/ordering/order.entity.js";
import { deliveryArea, toDelivery } from "./order-mapper.js";

const order = {
  id: "o1",
  code: "TGAAAAAA",
  status: "READY_FOR_PICKUP",
  storeId: "s1",
  store: {
    name: "Cơm Tấm",
    coverImageUrl: null,
    addressLine: "84 Đinh Tiên Hoàng"
  },
  items: [],
  subtotalVnd: 50000,
  deliveryFeeVnd: 15000,
  totalVnd: 65000,
  customerPhone: "+84860000001",
  customerNote: "Không hành",
  deliveryLabel: "Nhà",
  deliveryLine: "12 Nguyễn Trãi, P. Bến Thành, Q.1, TP. Hồ Chí Minh",
  deliveryNote: "Gọi trước khi giao",
  placedAt: new Date(),
  driverUserId: null,
  acceptedAt: null,
  preparingAt: null,
  readyAt: null,
  assignedAt: null,
  pickedUpAt: null,
  deliveredAt: null,
  closedAt: null
} as unknown as Order;

describe("toDelivery", () => {
  it("shows an open job's district only, without phone, exact address or notes", () => {
    const open = toDelivery(order, false);
    expect(open.customerPhone).toBeNull();
    expect(open.customerNote).toBeNull();
    expect(open.delivery).toEqual({
      label: "",
      line: "Q.1, TP. Hồ Chí Minh",
      note: null
    });
  });

  it("shows the full drop-off to the assigned driver", () => {
    const mine = toDelivery(order, true);
    expect(mine.customerPhone).toBe("+84860000001");
    expect(mine.customerNote).toBe("Không hành");
    expect(mine.delivery.line).toBe(order.deliveryLine);
    expect(mine.delivery.note).toBe("Gọi trước khi giao");
  });
});

describe("deliveryArea", () => {
  it("keeps the last two address parts", () => {
    expect(deliveryArea("1 A, B, C")).toBe("B, C");
    expect(deliveryArea("Quận 3")).toBe("Quận 3");
  });
});
