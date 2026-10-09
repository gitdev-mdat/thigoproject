import type { OrderDetail, OrderStatus, OrderSummary } from "../types/orders";

export type StatusTone = "progress" | "success" | "danger";

/** Customer-facing wording; every value reflects the order's server state. */
export function describeStatus(
  order: Pick<OrderSummary, "status" | "driverAssigned">
): { label: string; detail: string; tone: StatusTone } {
  switch (order.status) {
    case "PENDING":
      return {
        label: "Chờ quán xác nhận",
        detail: "Quán sẽ xác nhận đơn trong ít phút.",
        tone: "progress"
      };
    case "ACCEPTED":
    case "PREPARING":
      return {
        label:
          order.status === "ACCEPTED"
            ? "Quán đã nhận đơn"
            : "Quán đang chuẩn bị",
        detail: order.driverAssigned
          ? "Đã có tài xế nhận giao đơn này."
          : "THIGO đang tìm tài xế cho bạn.",
        tone: "progress"
      };
    case "READY_FOR_PICKUP":
      return {
        label: "Món đã sẵn sàng",
        detail: order.driverAssigned
          ? "Tài xế đang đến quán lấy món."
          : "THIGO đang tìm tài xế cho bạn.",
        tone: "progress"
      };
    case "PICKED_UP":
      return {
        label: "Tài xế đang giao",
        detail: "Món đang trên đường đến bạn.",
        tone: "progress"
      };
    case "DELIVERED":
      return {
        label: "Đã giao",
        detail: "Chúc bạn ngon miệng!",
        tone: "success"
      };
    case "REJECTED":
      return {
        label: "Quán đã từ chối",
        detail: "Bạn không bị tính tiền cho đơn này.",
        tone: "danger"
      };
    case "CANCELLED":
      return {
        label: "Đã huỷ",
        detail: "Bạn đã huỷ đơn này.",
        tone: "danger"
      };
  }
}

export const ACTIVE_STATUSES: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "PICKED_UP"
];

export function isActive(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export type TrackingStep = { label: string; at: string | null; done: boolean };

/** The order journey; only timestamps the server recorded count as done. */
export function trackingSteps(order: OrderDetail): TrackingStep[] {
  const t = order.timeline;
  const steps: [string, string | null][] = [
    ["Đã đặt đơn", t.placedAt],
    ["Quán nhận đơn", t.acceptedAt],
    ["Đang chuẩn bị", t.preparingAt],
    ["Món đã sẵn sàng", t.readyAt],
    ["Tài xế đã lấy món", t.pickedUpAt],
    ["Đã giao đến bạn", t.deliveredAt]
  ];
  return steps.map(([label, at]) => ({ label, at, done: at !== null }));
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
