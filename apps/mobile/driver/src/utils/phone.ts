const compact = (value: string) => value.trim().replace(/[\s.-]/g, "");

/**
 * Client-side hint only; the API remains the authority on phone validity.
 */
export function isLikelyVietnamesePhone(value: string): boolean {
  return /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/.test(compact(value));
}

export function formatPhone(value: string): string {
  const digits = compact(value);
  const local = digits.startsWith("+84")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : null;
  if (!local || local.length !== 9) return value.trim();
  const grouped = `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return digits.startsWith("+84") ? `+84 ${grouped}` : `0${grouped}`;
}

export function maskPhone(value: string): string {
  const formatted = formatPhone(value);
  return formatted.replace(/(\d{3}) (\d{3}) (\d{3})$/, "$1 *** $3");
}

export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
