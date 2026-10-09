import type {
  ApplicationStatus,
  OrderStatus,
  Role,
  StoreCategory
} from "../types/admin";

const TIMEZONE = "Asia/Ho_Chi_Minh";

const money = new Intl.NumberFormat("vi-VN");
const count = new Intl.NumberFormat("vi-VN");

export const formatVnd = (value: number) => `${money.format(value)} ₫`;
export const formatCount = (value: number) => count.format(value);

/** "1,2 tr ₫" style for KPI tiles where space is tight. */
export function formatCompactVnd(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value / 1_000_000)} tr ₫`;
  if (Math.abs(value) >= 1_000)
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value / 1_000)}k ₫`;
  return formatVnd(value);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(iso));
}

/** "5 phút trước", relative to `now`. */
export function formatRelative(iso: string | null, now = Date.now()): string {
  if (!iso) return "—";
  const minutes = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days} ngày trước` : formatDateTime(iso);
}

/** Shows +84 numbers the way Vietnamese users write them: 0860 000 001. */
export function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  const local = phone.startsWith("+84") ? `0${phone.slice(3)}` : phone;
  return local.length === 10 || local.length === 11
    ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
    : local;
}

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> =
  {
    PENDING: { label: "Chờ quán xác nhận", tone: "warning" },
    ACCEPTED: { label: "Đã nhận đơn", tone: "info" },
    PREPARING: { label: "Đang chuẩn bị", tone: "info" },
    READY_FOR_PICKUP: { label: "Chờ tài xế lấy", tone: "warning" },
    PICKED_UP: { label: "Đang giao", tone: "info" },
    DELIVERED: { label: "Đã giao", tone: "success" },
    REJECTED: { label: "Quán từ chối", tone: "danger" },
    CANCELLED: { label: "Đã hủy", tone: "neutral" }
  };

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "DELIVERED",
  "REJECTED",
  "CANCELLED"
];

export const CATEGORY_LABEL: Record<StoreCategory, string> = {
  FOOD: "Đồ ăn",
  COFFEE: "Cà phê",
  MILK_TEA: "Trà sữa"
};

export const ROLE_LABEL: Record<Role, string> = {
  CUSTOMER: "Khách hàng",
  MERCHANT: "Chủ quán",
  DRIVER: "Tài xế",
  ADMIN: "Quản trị"
};

export const APPLICATION_STATUS: Record<
  ApplicationStatus,
  { label: string; tone: Tone }
> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  PENDING_REVIEW: { label: "Chờ duyệt", tone: "warning" },
  CHANGES_REQUESTED: { label: "Chờ bổ sung", tone: "info" },
  APPROVED: { label: "Đã duyệt", tone: "success" },
  REJECTED: { label: "Từ chối", tone: "danger" }
};

export const APPLICATION_EVENT: Record<string, string> = {
  CREATE_DRAFT: "Chủ quán tạo hồ sơ",
  SUBMIT: "Chủ quán gửi hồ sơ",
  ADMIN_CREATE: "Quản trị thêm đối tác và duyệt",
  APPROVE: "Quản trị duyệt hồ sơ",
  REQUEST_CHANGES: "Quản trị yêu cầu bổ sung",
  REJECT: "Quản trị từ chối hồ sơ",
  ACTIVATE: "Cấp quyền chủ quán và tạo cửa hàng"
};
