import { describe, expect, it } from "vitest";

import { OrderStatus } from "../entities/ordering/order.entity.js";
import { fixtureTimeline } from "../repositories/ordering/development-order-fixture.repository.js";
import { CLAIMABLE_STATUSES } from "../repositories/ordering/order.repository.js";
import {
  DEVELOPMENT_ACTIVITY_DRIVER_PHONES,
  DEVELOPMENT_ACTIVITY_ORDERS,
  DEVELOPMENT_CUSTOMER_PHONE,
  DEVELOPMENT_DRIVER_PHONE,
  DEVELOPMENT_EXTRA_DRIVER_PHONE,
  DEVELOPMENT_ORDER_HISTORY
} from "./order-fixtures.js";

const LIVE = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.PICKED_UP
];

describe("development activity orders", () => {
  const all = [...DEVELOPMENT_ORDER_HISTORY, ...DEVELOPMENT_ACTIVITY_ORDERS];

  it("gives every order a distinct code", () => {
    const codes = all.map((order) => order.key.slice(-3));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("covers every order state", () => {
    expect(new Set(all.map((order) => order.status))).toEqual(
      new Set(Object.values(OrderStatus))
    );
  });

  it("never touches the regression accounts' live queues", () => {
    const regression = [
      DEVELOPMENT_CUSTOMER_PHONE,
      DEVELOPMENT_DRIVER_PHONE,
      DEVELOPMENT_EXTRA_DRIVER_PHONE
    ];
    for (const order of DEVELOPMENT_ACTIVITY_ORDERS) {
      expect(regression).not.toContain(order.customerPhone);
      expect(regression).not.toContain(order.driverPhone);
      if (LIVE.includes(order.status))
        expect(order.storeSlug).not.toBe("com-tam-sai-gon");
    }
  });

  it("assigns a driver wherever one is required or the order is claimable", () => {
    for (const order of DEVELOPMENT_ACTIVITY_ORDERS) {
      if (
        CLAIMABLE_STATUSES.includes(order.status) ||
        order.status === OrderStatus.PICKED_UP ||
        order.status === OrderStatus.DELIVERED
      )
        expect(DEVELOPMENT_ACTIVITY_DRIVER_PHONES).toContain(order.driverPhone);
    }
  });

  it("holds each activity driver to at most one active delivery", () => {
    const active = DEVELOPMENT_ACTIVITY_ORDERS.filter(
      (order) => order.driverPhone && LIVE.includes(order.status)
    ).map((order) => order.driverPhone);
    expect(new Set(active).size).toBe(active.length);
  });
});

describe("fixtureTimeline", () => {
  const placedAt = new Date("2026-10-01T03:00:00Z");

  it("stamps only the stages an order has reached", () => {
    const preparing = fixtureTimeline(OrderStatus.PREPARING, placedAt, true);
    expect(preparing.acceptedAt).not.toBeNull();
    expect(preparing.preparingAt).not.toBeNull();
    expect(preparing.readyAt).toBeNull();
    expect(preparing.pickedUpAt).toBeNull();
    expect(preparing.deliveredAt).toBeNull();
    expect(preparing.closedAt).toBeNull();
  });

  it("closes rejected and cancelled orders without later stages", () => {
    for (const status of [OrderStatus.REJECTED, OrderStatus.CANCELLED]) {
      const timeline = fixtureTimeline(status, placedAt, false);
      expect(timeline.closedAt).not.toBeNull();
      expect(timeline.acceptedAt).toBeNull();
      expect(timeline.assignedAt).toBeNull();
    }
  });

  it("orders the delivered timestamps in time", () => {
    const t = fixtureTimeline(OrderStatus.DELIVERED, placedAt, true);
    const sequence = [
      placedAt,
      t.acceptedAt,
      t.preparingAt,
      t.readyAt,
      t.pickedUpAt,
      t.deliveredAt
    ].map((value) => value!.getTime());
    expect([...sequence].sort((a, b) => a - b)).toEqual(sequence);
  });
});
