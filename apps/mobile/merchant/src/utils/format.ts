/** Formats an integer VND amount, e.g. 146000 -> "146.000 ₫". */
export function formatVnd(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const digits = String(Math.abs(Math.round(amount)));
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₫`;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Device-local 24-hour clock time, e.g. "12:05". */
export function formatClock(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Whole minutes between `iso` and `now`, never negative (clock skew). */
export function elapsedMinutes(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}

/** Relative age in Vietnamese, e.g. "3 phút trước", "1 giờ 5 phút trước". */
export function formatElapsed(minutes: number): string {
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 24 * 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} giờ ${rest} phút trước` : `${hours} giờ trước`;
  }
  return `${Math.floor(minutes / (24 * 60))} ngày trước`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * When an order was placed, e.g. "12:05 · 3 phút trước"; orders from an
 * earlier day also carry the date: "07/10 12:05 · 1 ngày trước".
 */
export function formatPlacedAt(iso: string, now: number): string {
  const placed = new Date(iso);
  const clock = formatClock(placed);
  const when = sameDay(placed, new Date(now))
    ? clock
    : `${pad(placed.getDate())}/${pad(placed.getMonth() + 1)} ${clock}`;
  return `${when} · ${formatElapsed(elapsedMinutes(iso, now))}`;
}
