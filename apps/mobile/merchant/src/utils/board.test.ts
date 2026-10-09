import { describe, expect, it } from "vitest";

import type {
  MerchantOrder,
  MerchantStore,
  OrderStatus
} from "../types/orders";
import {
  applyOrderUpdate,
  closedLabel,
  defaultSegment,
  groupOrders,
  nextStep,
  normalizeRejectReason,
  showsDriverState
} from "./board";

function order(id: string, status: OrderStatus): MerchantOrder {
  const placedAt = "2026-10-08T05:00:00.000Z";
  return {
    id,
    code: id.toUpperCase(),
    status,
    placedAt,
    driverAssigned: false,
    paymentMethod: "COD",
    itemCount: 1,
    subtotalVnd: 50000,
    deliveryFeeVnd: 15000,
    totalVnd: 65000,
    items: [],
    customerNote: null,
    rejectReason: null,
    timeline: {
      placedAt,
      acceptedAt: null,
      preparingAt: null,
      readyAt: null,
      assignedAt: null,
      pickedUpAt: null,
      deliveredAt: null,
      closedAt: null
    }
  };
}

const ids = (orders: MerchantOrder[]) => orders.map((item) => item.id);

describe("groupOrders", () => {
  it("splits active work by the next thing the store must do", () => {
    const groups = groupOrders({
      active: [
        order("a", "PENDING"),
        order("b", "ACCEPTED"),
        order("c", "PREPARING"),
        order("d", "READY_FOR_PICKUP"),
        order("e", "PENDING")
      ],
      recent: [order("f", "DELIVERED"), order("g", "CANCELLED")]
    });
    expect(ids(groups.new)).toEqual(["a", "e"]);
    expect(ids(groups.doing)).toEqual(["b", "c"]);
    expect(ids(groups.ready)).toEqual(["d"]);
    expect(ids(groups.done)).toEqual(["f", "g"]);
  });
});

describe("defaultSegment", () => {
  it("prefers new orders, then the first segment with work", () => {
    const empty = { new: [], doing: [], ready: [], done: [] };
    expect(defaultSegment(empty)).toBe("new");
    expect(
      defaultSegment({ ...empty, ready: [order("a", "READY_FOR_PICKUP")] })
    ).toBe("ready");
    expect(
      defaultSegment({
        ...empty,
        new: [order("a", "PENDING")],
        doing: [order("b", "ACCEPTED")]
      })
    ).toBe("new");
    expect(defaultSegment({ ...empty, done: [order("a", "DELIVERED")] })).toBe(
      "done"
    );
  });
});

describe("applyOrderUpdate", () => {
  const store = {
    id: "s",
    name: "Quán",
    addressLine: "1 Lê Lợi",
    isActive: true
  };

  it("replaces an order that is still active in place", () => {
    const board = {
      store,
      active: [order("a", "PENDING"), order("b", "PENDING")],
      recent: []
    };
    const next = applyOrderUpdate(board, order("a", "ACCEPTED"));
    expect(next.active.map((item) => item.status)).toEqual([
      "ACCEPTED",
      "PENDING"
    ]);
  });

  it("moves a closed order to the top of recent", () => {
    const board = {
      store,
      active: [order("a", "PENDING")],
      recent: [order("z", "DELIVERED")]
    };
    const next = applyOrderUpdate(board, order("a", "REJECTED"));
    expect(next.active).toEqual([]);
    expect(ids(next.recent)).toEqual(["a", "z"]);
  });
});

describe("order steps", () => {
  it("offers exactly one forward action per working state", () => {
    expect(nextStep("PENDING")?.action).toBe("accept");
    expect(nextStep("ACCEPTED")?.action).toBe("prepare");
    expect(nextStep("PREPARING")?.action).toBe("ready");
    expect(nextStep("READY_FOR_PICKUP")).toBeNull();
    expect(nextStep("DELIVERED")).toBeNull();
  });

  it("shows the driver state only between acceptance and hand-over", () => {
    expect(showsDriverState("PENDING")).toBe(false);
    expect(showsDriverState("ACCEPTED")).toBe(true);
    expect(showsDriverState("READY_FOR_PICKUP")).toBe(true);
    expect(showsDriverState("PICKED_UP")).toBe(false);
  });

  it("accepts reject reasons within the API bounds", () => {
    expect(normalizeRejectReason("  Hết món ")).toBe("Hết món");
    expect(normalizeRejectReason("ab")).toBeNull();
    expect(normalizeRejectReason("x".repeat(256))).toBeNull();
  });
});

describe("closedLabel", () => {
  const store: MerchantStore = {
    id: "s1",
    name: "Quán Cô Ba",
    addressLine: "1 Lê Lợi",
    isActive: true
  };

  it("names each reason customers cannot order", () => {
    expect(closedLabel({ ...store, closedReason: "UNPUBLISHED" })).toBe(
      "Cửa hàng đang ẩn với khách"
    );
    expect(closedLabel({ ...store, closedReason: "PAUSED" })).toBe(
      "Đang tạm ngưng nhận đơn"
    );
    expect(closedLabel({ ...store, closedReason: "OUTSIDE_HOURS" })).toBe(
      "Ngoài giờ mở cửa"
    );
  });

  it("shows nothing while the store is open", () => {
    expect(closedLabel({ ...store, closedReason: null })).toBeUndefined();
    expect(
      closedLabel({ ...store, isActive: false, closedReason: null })
    ).toBeUndefined();
  });

  it("falls back to visibility when the API omits the reason", () => {
    expect(closedLabel(store)).toBeUndefined();
    expect(closedLabel({ ...store, isActive: false })).toBe(
      "Cửa hàng đang ẩn với khách"
    );
  });
});
