import type { Delivery, DeliveryItem, OrderStatus } from "../types/delivery";

/** Formats an integer VND amount, e.g. 146000 -> "146.000 ₫". */
export function formatVnd(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const digits = String(Math.abs(Math.round(amount)));
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₫`;
}

/** Local wall-clock time as HH:MM. */
export function formatClock(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatItemCount(count: number): string {
  return `${count} món`;
}

/** "2× Cơm tấm, 1× Trà đá" for a one-line summary. */
export function itemsSummary(items: Pick<DeliveryItem, "name" | "quantity">[]) {
  return items.map((item) => `${item.quantity}× ${item.name}`).join(", ");
}

export function optionsSummary(item: Pick<DeliveryItem, "options">): string {
  return item.options.map((option) => option.name).join(", ");
}

/** A dialable `tel:` URL; keeps only digits and a leading "+". */
export function telUrl(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

/** Whether the store has reported the food ready (or it is already collected). */
export function isFoodReady(status: OrderStatus): boolean {
  return status === "READY_FOR_PICKUP" || status === "PICKED_UP";
}

export type ReadinessTone = "success" | "warning";

/** Pickup readiness shown on a claimable delivery card. */
export function readiness(status: OrderStatus): {
  label: string;
  tone: ReadinessTone;
} {
  return isFoodReady(status)
    ? { label: "Món đã sẵn sàng", tone: "success" }
    : { label: "Quán đang chuẩn bị", tone: "warning" };
}

export type StageAction =
  | { kind: "wait"; label: string; hint: string }
  | { kind: "pickup"; label: string }
  | { kind: "deliver"; label: string };

export type DeliveryStage = {
  /** Where the driver is heading next. */
  title: string;
  chip: { label: string; tone: "success" | "warning" | "info" };
  /** Which stop is the current destination. */
  target: "pickup" | "dropoff";
  action: StageAction;
};

/**
 * Driver-facing stage for an unfinished delivery. Returns null for statuses a
 * driver cannot act on, so the screen falls back to the list.
 */
export function deliveryStage(status: OrderStatus): DeliveryStage | null {
  switch (status) {
    case "ACCEPTED":
    case "PREPARING":
      return {
        title: "Đến quán lấy món",
        chip: { label: "Quán đang chuẩn bị", tone: "warning" },
        target: "pickup",
        action: {
          kind: "wait",
          label: "Đã lấy hàng",
          hint: "Quán đang chuẩn bị — chờ quán báo món xong"
        }
      };
    case "READY_FOR_PICKUP":
      return {
        title: "Đến quán lấy món",
        chip: { label: "Món đã sẵn sàng", tone: "success" },
        target: "pickup",
        action: { kind: "pickup", label: "Đã lấy hàng" }
      };
    case "PICKED_UP":
      return {
        title: "Đang giao cho khách",
        chip: { label: "Đã lấy món", tone: "info" },
        target: "dropoff",
        action: { kind: "deliver", label: "Đã giao thành công" }
      };
    default:
      return null;
  }
}

/** Confirmation copy naming the order and the cash to collect. */
export function deliverConfirmation(
  delivery: Pick<Delivery, "code" | "totalVnd">
): { title: string; message: string; confirm: string } {
  return {
    title: `Xác nhận đã giao đơn ${delivery.code}?`,
    message: `Chỉ xác nhận khi khách đã nhận món và bạn đã thu ${formatVnd(delivery.totalVnd)} tiền mặt.`,
    confirm: "Đã giao và thu tiền"
  };
}
