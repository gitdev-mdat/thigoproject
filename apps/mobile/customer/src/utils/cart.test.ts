import { describe, expect, it } from "vitest";
import type { Product } from "../types/catalog";
import {
  cartCount,
  cartReducer,
  cartSubtotal,
  defaultSelection,
  emptyCart,
  selectedOptions,
  selectionError,
  toggleOption
} from "./cart";

const tea: Product = {
  id: "p1",
  name: "Trà sữa",
  description: null,
  priceVnd: 45000,
  imageUrl: null,
  isAvailable: true,
  optionGroups: [
    {
      id: "size",
      name: "Kích cỡ",
      minSelect: 1,
      maxSelect: 1,
      options: [
        { id: "m", name: "M", priceDeltaVnd: 0, isAvailable: true },
        { id: "l", name: "L", priceDeltaVnd: 8000, isAvailable: true }
      ]
    },
    {
      id: "top",
      name: "Topping",
      minSelect: 0,
      maxSelect: 2,
      options: [
        { id: "a", name: "Trân châu", priceDeltaVnd: 6000, isAvailable: true },
        { id: "b", name: "Pudding", priceDeltaVnd: 8000, isAvailable: true },
        { id: "c", name: "Kem", priceDeltaVnd: 10000, isAvailable: true }
      ]
    }
  ]
};

function line(selection = defaultSelection(tea), quantity = 1) {
  return {
    productId: tea.id,
    name: tea.name,
    imageUrl: null,
    basePriceVnd: tea.priceVnd,
    options: selectedOptions(tea, selection),
    quantity
  };
}

describe("option selection", () => {
  it("preselects required single choices only", () => {
    expect(defaultSelection(tea)).toEqual({ size: ["m"], top: [] });
  });

  it("switches a single choice and caps multiple choices at the maximum", () => {
    const group = tea.optionGroups[1]!;
    let selection = toggleOption(
      tea.optionGroups[0]!,
      defaultSelection(tea),
      "l"
    );
    expect(selection.size).toEqual(["l"]);
    selection = toggleOption(group, selection, "a");
    selection = toggleOption(group, selection, "b");
    selection = toggleOption(group, selection, "c");
    expect(selection.top).toEqual(["a", "b"]);
    expect(toggleOption(group, selection, "a").top).toEqual(["b"]);
  });

  it("explains a missing required choice", () => {
    expect(selectionError(tea, { size: [], top: [] })).toBe("Chọn kích cỡ");
    expect(selectionError(tea, defaultSelection(tea))).toBeNull();
  });
});

describe("cartReducer", () => {
  const add = (l = line()) =>
    ({ type: "add", storeId: "s1", storeName: "Mây", line: l }) as const;

  it("merges identical lines and keeps different options apart", () => {
    let cart = cartReducer(emptyCart, add());
    cart = cartReducer(cart, add());
    cart = cartReducer(cart, add(line({ size: ["l"], top: ["a"] })));

    expect(cart.lines).toHaveLength(2);
    expect(cartCount(cart)).toBe(3);
    expect(cartSubtotal(cart)).toBe(45000 * 2 + 59000);
  });

  it("starts a new cart when adding from another store", () => {
    const cart = cartReducer(cartReducer(emptyCart, add()), {
      ...add(),
      storeId: "s2",
      storeName: "Khác"
    });
    expect(cart.storeId).toBe("s2");
    expect(cart.lines).toHaveLength(1);
  });

  it("removes a line at zero and empties the cart with it", () => {
    const cart = cartReducer(emptyCart, add());
    const key = cart.lines[0]!.key;
    expect(
      cartReducer(cart, { type: "setQuantity", key, quantity: 0 })
    ).toEqual(emptyCart);
  });
});
