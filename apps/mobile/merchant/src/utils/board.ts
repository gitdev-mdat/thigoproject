import type {
  MerchantOrder,
  MerchantStore,
  OrderAction,
  OrderBoard,
  OrderStatus,
  StoreClosedReason
} from "../types/orders";

export type SegmentKey = "new" | "doing" | "ready" | "done";

export const SEGMENTS: {
  key: SegmentKey;
  label: string;
  emptyTitle: string;
  emptyBody: string;
}[] = [
  {
    key: "new",
    label: "Đơn mới",
    emptyTitle: "Chưa có đơn mới",
    emptyBody: "Đơn mới sẽ tự hiện ở đây."
  },
  {
    key: "doing",
    label: "Đang làm",
    emptyTitle: "Không có đơn đang làm",
    emptyBody: "Đơn đã nhận sẽ chuyển vào đây."
  },
  {
    key: "ready",
    label: "Chờ lấy",
    emptyTitle: "Không có đơn chờ lấy",
    emptyBody: "Đơn đã báo xong món sẽ chờ tài xế ở đây."
  },
  {
    key: "done",
    label: "Đã xong",
    emptyTitle: "Chưa có đơn đã xong",
    emptyBody: "Đơn đã giao, bị từ chối hoặc bị huỷ gần đây sẽ hiện ở đây."
  }
];

const ACTIVE_SEGMENT: Partial<Record<OrderStatus, SegmentKey>> = {
  PENDING: "new",
  ACCEPTED: "doing",
  PREPARING: "doing",
  READY_FOR_PICKUP: "ready"
};

export function isActiveStatus(status: OrderStatus): boolean {
  return status in ACTIVE_SEGMENT;
}

/** Splits the board into the four work segments, keeping server order. */
export function groupOrders(
  board: Pick<OrderBoard, "active" | "recent">
): Record<SegmentKey, MerchantOrder[]> {
  const groups: Record<SegmentKey, MerchantOrder[]> = {
    new: [],
    doing: [],
    ready: [],
    done: []
  };
  for (const order of board.active)
    groups[ACTIVE_SEGMENT[order.status] ?? "done"].push(order);
  groups.done.push(...board.recent);
  return groups;
}

/** New orders first when there are any, otherwise the first non-empty segment. */
export function defaultSegment(
  groups: Record<SegmentKey, MerchantOrder[]>
): SegmentKey {
  return SEGMENTS.find(({ key }) => groups[key].length > 0)?.key ?? "new";
}

/**
 * Applies an order the API just returned so the board reflects the move
 * before the next refresh: active orders are replaced in place, closed ones
 * leave the active list and lead the recent list.
 */
export function applyOrderUpdate(
  board: OrderBoard,
  order: MerchantOrder
): OrderBoard {
  if (isActiveStatus(order.status))
    return {
      ...board,
      active: board.active.map((item) => (item.id === order.id ? order : item))
    };
  return {
    ...board,
    active: board.active.filter((item) => item.id !== order.id),
    recent: [order, ...board.recent.filter((item) => item.id !== order.id)]
  };
}

const CLOSED_LABELS: Record<StoreClosedReason, string> = {
  UNPUBLISHED: "Cửa hàng đang ẩn với khách",
  PAUSED: "Đang tạm ngưng nhận đơn",
  OUTSIDE_HOURS: "Ngoài giờ mở cửa"
};

/**
 * Header chip for a store customers cannot order from, or undefined when it
 * is open. Without `closedReason` (older API), only unpublished is known.
 */
export function closedLabel(store: MerchantStore): string | undefined {
  if (store.closedReason === undefined)
    return store.isActive ? undefined : CLOSED_LABELS.UNPUBLISHED;
  return store.closedReason ? CLOSED_LABELS[store.closedReason] : undefined;
}

export type StatusTone = "warning" | "info" | "success" | "danger" | "neutral";

/** Store-facing wording for each status; colour is never the only cue. */
export function describeStatus(status: OrderStatus): {
  label: string;
  tone: StatusTone;
} {
  switch (status) {
    case "PENDING":
      return { label: "Đơn mới", tone: "warning" };
    case "ACCEPTED":
      return { label: "Đã nhận", tone: "info" };
    case "PREPARING":
      return { label: "Đang chuẩn bị", tone: "info" };
    case "READY_FOR_PICKUP":
      return { label: "Đã xong món", tone: "success" };
    case "PICKED_UP":
      return { label: "Tài xế đã lấy", tone: "neutral" };
    case "DELIVERED":
      return { label: "Đã giao", tone: "success" };
    case "REJECTED":
      return { label: "Đã từ chối", tone: "danger" };
    case "CANCELLED":
      return { label: "Khách đã huỷ", tone: "danger" };
  }
}

export type NextStep = {
  action: Exclude<OrderAction, "reject">;
  label: string;
  loadingLabel: string;
  done: string;
};

/** The single forward action a store can take from each status, if any. */
export function nextStep(status: OrderStatus): NextStep | null {
  switch (status) {
    case "PENDING":
      return {
        action: "accept",
        label: "Nhận đơn",
        loadingLabel: "Đang nhận đơn…",
        done: "Đã nhận đơn. Đơn chuyển sang mục Đang làm."
      };
    case "ACCEPTED":
      return {
        action: "prepare",
        label: "Bắt đầu chuẩn bị",
        loadingLabel: "Đang cập nhật…",
        done: "Đã chuyển đơn sang Đang chuẩn bị."
      };
    case "PREPARING":
      return {
        action: "ready",
        label: "Báo món đã xong",
        loadingLabel: "Đang báo…",
        done: "Đã báo xong món. Đơn chuyển sang mục Chờ lấy."
      };
    default:
      return null;
  }
}

/** Shows whether a driver is coming, from acceptance until hand-over. */
export function showsDriverState(status: OrderStatus): boolean {
  return (
    status === "ACCEPTED" ||
    status === "PREPARING" ||
    status === "READY_FOR_PICKUP"
  );
}

export const REJECT_PRESETS = [
  "Hết món",
  "Quán đang quá tải",
  "Sắp đóng cửa"
] as const;

/** Mirrors the API bounds (3–255 characters) as a hint; the API decides. */
export function normalizeRejectReason(value: string): string | null {
  const reason = value.trim();
  return reason.length >= 3 && reason.length <= 255 ? reason : null;
}
