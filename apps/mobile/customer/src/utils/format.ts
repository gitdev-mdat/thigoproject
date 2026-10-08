/** Formats an integer VND amount, e.g. 55000 -> "55.000 ₫". */
export function formatVnd(amount: number): string {
  return `${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₫`;
}

/** Formats a review count compactly, e.g. 1240 -> "1,2k". */
export function formatCount(count: number): string {
  if (count < 1000) return String(count);
  return `${(count / 1000).toFixed(1).replace(".", ",").replace(/,0$/, "")}k`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1).replace(".", ",");
}

const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Short Vietnamese date for an order, e.g. "T4, 07/10". */
export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${weekdays[date.getDay()]}, ${dd}/${mm}`;
}
