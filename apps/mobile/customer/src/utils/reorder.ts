import type { Product, StoreDetail } from "../types/catalog";
import type { OrderLine } from "../types/orders";
import {
  selectedOptions,
  selectionError,
  type CartLine,
  type Selection
} from "./cart";

export type ReorderResult = {
  lines: Omit<CartLine, "key">[];
  skipped: string[];
};

/**
 * Rebuilds cart lines from a past order against today's menu. Items that are
 * gone, sold out, or whose options no longer match are skipped, never guessed.
 */
export function rebuildCart(
  store: StoreDetail,
  items: OrderLine[]
): ReorderResult {
  const products = new Map<string, Product>(
    store.categories
      .flatMap((category) => category.products)
      .map((product) => [product.id, product])
  );
  const lines: Omit<CartLine, "key">[] = [];
  const skipped: string[] = [];
  for (const item of items) {
    const product = products.get(item.productId);
    if (!product || !product.isAvailable) {
      skipped.push(item.name);
      continue;
    }
    const selection: Selection = {};
    let matched = true;
    for (const chosen of item.options) {
      const group = product.optionGroups.find(
        (candidate) => candidate.name === chosen.groupName
      );
      const option = group?.options.find(
        (candidate) => candidate.name === chosen.name && candidate.isAvailable
      );
      if (!group || !option) {
        matched = false;
        break;
      }
      selection[group.id] = [...(selection[group.id] ?? []), option.id];
    }
    if (!matched || selectionError(product, selection)) {
      skipped.push(item.name);
      continue;
    }
    lines.push({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      basePriceVnd: product.priceVnd,
      options: selectedOptions(product, selection),
      quantity: item.quantity
    });
  }
  return { lines, skipped };
}
