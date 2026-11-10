import type { Product, ProductOptionGroup } from "../types/catalog";

export type SelectedOption = {
  groupId: string;
  groupName: string;
  id: string;
  name: string;
  priceDeltaVnd: number;
};

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  basePriceVnd: number;
  options: SelectedOption[];
  quantity: number;
};

export type Cart = {
  storeId: string | null;
  storeName: string;
  lines: CartLine[];
};

/** Option ids chosen per group id. */
export type Selection = Record<string, string[]>;

export const MAX_LINE_QUANTITY = 20;
export const emptyCart: Cart = { storeId: null, storeName: "", lines: [] };

/** Preselects the first available choice of each required single-choice group. */
export function defaultSelection(product: Product): Selection {
  const selection: Selection = {};
  for (const group of product.optionGroups) {
    const first = group.options.find((option) => option.isAvailable);
    selection[group.id] =
      group.minSelect === 1 && group.maxSelect === 1 && first ? [first.id] : [];
  }
  return selection;
}

export function toggleOption(
  group: ProductOptionGroup,
  selection: Selection,
  optionId: string
): Selection {
  const current = selection[group.id] ?? [];
  if (group.maxSelect === 1) {
    const next =
      current.includes(optionId) && group.minSelect === 0 ? [] : [optionId];
    return { ...selection, [group.id]: next };
  }
  if (current.includes(optionId))
    return {
      ...selection,
      [group.id]: current.filter((id) => id !== optionId)
    };
  if (current.length >= group.maxSelect) return selection;
  return { ...selection, [group.id]: [...current, optionId] };
}

/** Explains the first unmet group rule, or null when the selection is valid. */
export function selectionError(
  product: Product,
  selection: Selection
): string | null {
  for (const group of product.optionGroups) {
    const count = (selection[group.id] ?? []).length;
    if (count < group.minSelect)
      return group.minSelect === 1
        ? `Chọn ${group.name.toLowerCase()}`
        : `Chọn ít nhất ${group.minSelect} mục ${group.name.toLowerCase()}`;
    if (count > group.maxSelect)
      return `Chọn tối đa ${group.maxSelect} mục ${group.name.toLowerCase()}`;
  }
  return null;
}

export function selectedOptions(
  product: Product,
  selection: Selection
): SelectedOption[] {
  return product.optionGroups.flatMap((group) =>
    group.options
      .filter((option) => (selection[group.id] ?? []).includes(option.id))
      .map((option) => ({
        groupId: group.id,
        groupName: group.name,
        id: option.id,
        name: option.name,
        priceDeltaVnd: option.priceDeltaVnd
      }))
  );
}

export function lineKey(productId: string, options: SelectedOption[]): string {
  return [productId, ...options.map((option) => option.id).sort()].join("|");
}

export function unitPrice(line: Pick<CartLine, "basePriceVnd" | "options">) {
  return line.options.reduce(
    (sum, option) => sum + option.priceDeltaVnd,
    line.basePriceVnd
  );
}

export function cartSubtotal(cart: Cart): number {
  return cart.lines.reduce(
    (sum, line) => sum + unitPrice(line) * line.quantity,
    0
  );
}

export function cartCount(cart: Cart): number {
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0);
}

export type CartAction =
  | {
      type: "add";
      storeId: string;
      storeName: string;
      line: Omit<CartLine, "key">;
    }
  | { type: "setQuantity"; key: string; quantity: number }
  | { type: "clear" };

/** A cart holds one store; adding from another store starts a new cart. */
export function cartReducer(cart: Cart, action: CartAction): Cart {
  switch (action.type) {
    case "add": {
      const base =
        cart.storeId === action.storeId
          ? cart
          : { storeId: action.storeId, storeName: action.storeName, lines: [] };
      const key = lineKey(action.line.productId, action.line.options);
      const existing = base.lines.find((line) => line.key === key);
      const lines = existing
        ? base.lines.map((line) =>
            line.key === key
              ? {
                  ...line,
                  quantity: Math.min(
                    MAX_LINE_QUANTITY,
                    line.quantity + action.line.quantity
                  )
                }
              : line
          )
        : [...base.lines, { ...action.line, key }];
      return { ...base, lines };
    }
    case "setQuantity": {
      const lines = cart.lines
        .map((line) =>
          line.key === action.key
            ? {
                ...line,
                quantity: Math.min(MAX_LINE_QUANTITY, action.quantity)
              }
            : line
        )
        .filter((line) => line.quantity > 0);
      return lines.length ? { ...cart, lines } : emptyCart;
    }
    case "clear":
      return emptyCart;
  }
}
