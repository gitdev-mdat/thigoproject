import type { DayHours, OpeningHours } from "../types/storefront";

/** Monday-first, matching the API. */
export const DAY_LABELS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật"
] as const;

export const DEFAULT_DAY: DayHours = { open: "07:00", close: "21:00" };

/** Editable state of one day. Times are kept while a day is closed. */
export type DayDraft = { closed: boolean; open: string; close: string };

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return TIME.test(value);
}

/** Close may also be "24:00" (midnight at the end of the day). */
export function isValidCloseTime(value: string): boolean {
  return value === "24:00" || TIME.test(value);
}

export function minutesOf(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/** Formats digits as typed into "HH:MM", e.g. "0830" -> "08:30". */
export function formatTimeInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
    : digits;
}

export function toDrafts(hours: OpeningHours | null): DayDraft[] {
  return DAY_LABELS.map((_, index) => {
    const day = hours?.[index];
    return day
      ? { closed: false, open: day.open, close: day.close }
      : { closed: hours !== null, ...DEFAULT_DAY };
  });
}

/** One message per day (undefined when valid). */
export function dayErrors(days: DayDraft[]): (string | undefined)[] {
  return days.map((day) => {
    if (day.closed) return undefined;
    if (!isValidTime(day.open) || !isValidCloseTime(day.close))
      return "Nhập giờ theo dạng HH:MM, ví dụ 07:30.";
    if (day.close === day.open) return "Giờ đóng cửa phải khác giờ mở cửa.";
    return undefined;
  });
}

/** True when a window runs past midnight (close earlier than open). */
export function closesNextDay(open: string, close: string): boolean {
  return (
    isValidTime(open) &&
    isValidCloseTime(close) &&
    close !== "24:00" &&
    minutesOf(close) < minutesOf(open)
  );
}

/** Hint under a valid overnight window, e.g. "Đóng cửa lúc 02:00 hôm sau". */
export function overnightHint(day: DayDraft): string | undefined {
  return !day.closed && closesNextDay(day.open, day.close)
    ? `Đóng cửa lúc ${day.close} hôm sau`
    : undefined;
}

/** "18:00–02:00 (hôm sau)" for an overnight window. */
export function formatWindow(day: DayHours): string {
  return `${day.open}–${day.close}${closesNextDay(day.open, day.close) ? " (hôm sau)" : ""}`;
}

/** Week-level problem, such as every day being closed. */
export function weekError(days: DayDraft[]): string | undefined {
  return days.every((day) => day.closed)
    ? "Cửa hàng cần mở ít nhất một ngày trong tuần."
    : undefined;
}

export function fromDrafts(days: DayDraft[]): OpeningHours {
  return days.map((day) =>
    day.closed ? null : { open: day.open, close: day.close }
  );
}

/** Copies one day's state to the whole week. */
export function applyToAll(days: DayDraft[], source: number): DayDraft[] {
  const from = days[source];
  return from ? days.map(() => ({ ...from })) : days;
}

/** Short Vietnamese summary for a store card. */
export function summarizeHours(hours: OpeningHours | null): string {
  if (hours === null) return "Không giới hạn giờ";
  const open = hours.filter((day): day is DayHours => day !== null);
  if (!open.length) return "Chưa đặt giờ mở cửa";
  const first = open[0]!;
  const same = open.every(
    (day) => day.open === first.open && day.close === first.close
  );
  const window = formatWindow(first);
  if (same && open.length === 7) return `Mỗi ngày ${window}`;
  const closed = hours
    .map((day, index) => (day ? null : DAY_LABELS[index]))
    .filter(Boolean);
  if (same) return `${window} · Nghỉ ${closed.join(", ")}`;
  return `Giờ khác nhau theo ngày · Mở ${open.length}/7 ngày`;
}

/** Today's window in the device's week (Monday-first), for the dashboard. */
export function todayHours(
  hours: OpeningHours | null,
  now: Date = new Date()
): string {
  if (hours === null) return "Không giới hạn giờ";
  const index = (now.getDay() + 6) % 7;
  const day = hours[index];
  return day ? `Hôm nay ${formatWindow(day)}` : "Hôm nay nghỉ";
}
