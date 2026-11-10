import { describe, expect, it } from "vitest";
import type { OrderDetail } from "../types/orders";
import { describeStatus, isActive, trackingSteps } from "./orderStatus";

describe("describeStatus", () => {
  it("mentions the driver only when the server says one is assigned", () => {
    expect(
      describeStatus({ status: "PREPARING", driverAssigned: false }).detail
    ).toContain("tìm tài xế");
    expect(
      describeStatus({ status: "PREPARING", driverAssigned: true }).detail
    ).toContain("Đã có tài xế");
  });

  it("marks terminal states", () => {
    expect(
      describeStatus({ status: "DELIVERED", driverAssigned: true }).tone
    ).toBe("success");
    expect(
      describeStatus({ status: "REJECTED", driverAssigned: false }).tone
    ).toBe("danger");
    expect(isActive("DELIVERED")).toBe(false);
    expect(isActive("PICKED_UP")).toBe(true);
  });
});

describe("trackingSteps", () => {
  it("completes only steps with a recorded timestamp", () => {
    const steps = trackingSteps({
      timeline: {
        placedAt: "2026-10-08T05:00:00Z",
        acceptedAt: "2026-10-08T05:02:00Z",
        preparingAt: null,
        readyAt: null,
        assignedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        closedAt: null
      }
    } as OrderDetail);
    expect(steps.map((step) => step.done)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false
    ]);
  });
});
