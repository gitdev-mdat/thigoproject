import type {
  OpeningHours,
  StoreCategory,
  StoreClosedReason
} from "../types/catalog";

export const categoryLabel: Record<StoreCategory, string> = {
  FOOD: "Đồ ăn",
  COFFEE: "Cà phê",
  MILK_TEA: "Trà sữa"
};

/** The last part of an address line, e.g. "84 Đinh Tiên Hoàng, P. Đa Kao, Q.1" -> "Q.1". */
export function districtOf(addressLine: string): string {
  const parts = addressLine.split(",").map((part) => part.trim());
  return parts[parts.length - 1] ?? addressLine;
}

/** Short status shown on cards and the store header when a store cannot take orders. */
export const closedLabel: Record<StoreClosedReason, string> = {
  UNPUBLISHED: "Quán chưa mở bán",
  PAUSED: "Quán tạm ngưng nhận đơn",
  OUTSIDE_HOURS: "Ngoài giờ mở cửa"
};

/** Monday = 0 … Sunday = 6 in Vietnam time (UTC+7, no daylight saving). */
export function vietnamWeekday(now: Date): number {
  const local = new Date(now.getTime() + 7 * 60 * 60_000);
  return (local.getUTCDay() + 6) % 7;
}

/** "Hôm nay 06:30–22:00", "Hôm nay nghỉ", or null when the store keeps no schedule. */
export function todayHoursLabel(
  hours: OpeningHours | null,
  now: Date = new Date()
): string | null {
  if (!hours) return null;
  const today = hours[vietnamWeekday(now)];
  return today ? `Hôm nay ${today.open}–${today.close}` : "Hôm nay nghỉ";
}
