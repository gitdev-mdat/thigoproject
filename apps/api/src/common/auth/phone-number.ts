export function canonicalizeVietnamesePhone(input: string): string {
  const compact = input.trim().replace(/[\s.-]/g, "");
  const canonical = compact.startsWith("0")
    ? `+84${compact.slice(1)}`
    : compact;
  if (!/^\+84(?:3|5|7|8|9)\d{8}$/.test(canonical)) {
    throw new Error("Số điện thoại không hợp lệ.");
  }
  return canonical;
}
