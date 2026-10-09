import { describe, expect, it } from "vitest";

import {
  deliverConfirmation,
  deliveryStage,
  formatClock,
  formatItemCount,
  formatVnd,
  isFoodReady,
  itemsSummary,
  optionsSummary,
  readiness,
  telUrl
} from "./delivery";

describe("formatVnd", () => {
  it("groups thousands with dots and appends the đồng sign", () => {
    expect(formatVnd(146000)).toBe("146.000 ₫");
    expect(formatVnd(1250000)).toBe("1.250.000 ₫");
    expect(formatVnd(900)).toBe("900 ₫");
    expect(formatVnd(0)).toBe("0 ₫");
  });
});

describe("formatClock", () => {
  it("pads hours and minutes", () => {
    expect(formatClock(new Date(2026, 9, 8, 7, 5))).toBe("07:05");
    expect(formatClock(new Date(2026, 9, 8, 18, 42))).toBe("18:42");
  });
});

describe("item summaries", () => {
  it("joins quantities and names", () => {
    expect(
      itemsSummary([
        { name: "Cơm tấm", quantity: 2 },
        { name: "Trà đá", quantity: 1 }
      ])
    ).toBe("2× Cơm tấm, 1× Trà đá");
    expect(formatItemCount(3)).toBe("3 món");
  });

  it("lists chosen options", () => {
    expect(
      optionsSummary({
        options: [
          { groupName: "Size", name: "Lớn", priceDeltaVnd: 5000 },
          { groupName: "Thêm", name: "Trứng", priceDeltaVnd: 5000 }
        ]
      })
    ).toBe("Lớn, Trứng");
  });
});

describe("telUrl", () => {
  it("strips formatting but keeps an international prefix", () => {
    expect(telUrl("0901 234 567")).toBe("tel:0901234567");
    expect(telUrl("+84 901-234-567")).toBe("tel:+84901234567");
  });
});

describe("readiness", () => {
  it("tells the driver whether the food is ready", () => {
    expect(readiness("READY_FOR_PICKUP")).toEqual({
      label: "Món đã sẵn sàng",
      tone: "success"
    });
    expect(readiness("ACCEPTED").label).toBe("Quán đang chuẩn bị");
    expect(readiness("PREPARING").tone).toBe("warning");
    expect(isFoodReady("PICKED_UP")).toBe(true);
    expect(isFoodReady("PREPARING")).toBe(false);
  });
});

describe("deliveryStage", () => {
  it("blocks pickup while the store is still preparing", () => {
    for (const status of ["ACCEPTED", "PREPARING"] as const) {
      const stage = deliveryStage(status);
      expect(stage?.title).toBe("Đến quán lấy món");
      expect(stage?.target).toBe("pickup");
      expect(stage?.action).toEqual({
        kind: "wait",
        label: "Đã lấy hàng",
        hint: "Quán đang chuẩn bị — chờ quán báo món xong"
      });
    }
  });

  it("offers pickup once the food is ready", () => {
    expect(deliveryStage("READY_FOR_PICKUP")?.action).toEqual({
      kind: "pickup",
      label: "Đã lấy hàng"
    });
  });

  it("offers delivery after pickup", () => {
    const stage = deliveryStage("PICKED_UP");
    expect(stage?.title).toBe("Đang giao cho khách");
    expect(stage?.target).toBe("dropoff");
    expect(stage?.action.kind).toBe("deliver");
    expect(stage?.action.label).toBe("Đã giao thành công");
  });

  it("has no stage for finished or unconfirmed orders", () => {
    expect(deliveryStage("DELIVERED")).toBeNull();
    expect(deliveryStage("PENDING")).toBeNull();
    expect(deliveryStage("CANCELLED")).toBeNull();
  });
});

describe("deliverConfirmation", () => {
  it("names the order and the cash to collect", () => {
    const copy = deliverConfirmation({ code: "TG1234", totalVnd: 146000 });
    expect(copy.title).toContain("TG1234");
    expect(copy.message).toContain("146.000 ₫");
  });
});
