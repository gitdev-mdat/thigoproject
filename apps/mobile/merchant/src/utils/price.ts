/** Mirrors the API price bounds as a hint; the API remains authoritative. */
export const MIN_PRICE_VND = 1_000;
export const MAX_PRICE_VND = 10_000_000;

/** Longest digit run the field accepts (keeps typing past the max visible). */
const MAX_DIGITS = 9;

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Keeps the digits a user typed, e.g. "35.000 ₫" -> "35000". */
export function priceDigits(input: string): string {
  return input
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, MAX_DIGITS);
}

/** Integer VND from typed text, or null when nothing was entered. */
export function parsePrice(input: string): number | null {
  const digits = priceDigits(input);
  return digits ? Number(digits) : null;
}

/** Grouped thousands for the input itself, e.g. 35000 -> "35.000". */
export function formatPriceInput(value: number | null): string {
  if (value === null) return "";
  return group(String(Math.trunc(value)));
}

export function priceError(value: number | null): string | undefined {
  if (value === null) return "Nhập giá bán của món.";
  if (!Number.isSafeInteger(value) || value < MIN_PRICE_VND)
    return `Giá tối thiểu ${group(String(MIN_PRICE_VND))} ₫.`;
  if (value > MAX_PRICE_VND)
    return `Giá tối đa ${group(String(MAX_PRICE_VND))} ₫.`;
  return undefined;
}
