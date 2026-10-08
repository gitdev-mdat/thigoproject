import type { StoreCategory } from "../types/catalog";

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
