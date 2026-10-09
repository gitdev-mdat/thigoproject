import { describe, expect, it } from "vitest";
import type { StoreDetail } from "../types/catalog";
import type { OrderLine } from "../types/orders";
import { rebuildCart } from "./reorder";

const store = {
  id: "s",
  categories: [
    {
      id: "c",
      name: "Trà sữa",
      products: [
        {
          id: "tea",
          name: "Trà sữa",
          description: null,
          priceVnd: 47000,
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
            }
          ]
        },
        {
          id: "gone",
          name: "Hết",
          description: null,
          priceVnd: 10000,
          imageUrl: null,
          isAvailable: false,
          optionGroups: []
        }
      ]
    }
  ]
} as unknown as StoreDetail;

const line = (productId: string, options: OrderLine["options"]): OrderLine => ({
  productId,
  name: productId,
  imageUrl: null,
  quantity: 2,
  unitPriceVnd: 1,
  lineTotalVnd: 2,
  options
});

describe("rebuildCart", () => {
  it("re-selects options by name and uses today's prices", () => {
    const result = rebuildCart(store, [
      line("tea", [{ groupName: "Kích cỡ", name: "L", priceDeltaVnd: 5000 }])
    ]);
    expect(result.skipped).toEqual([]);
    expect(result.lines[0]).toMatchObject({ basePriceVnd: 47000, quantity: 2 });
    expect(result.lines[0]!.options.map((option) => option.id)).toEqual(["l"]);
  });

  it("skips sold-out, missing and no-longer-valid items", () => {
    const result = rebuildCart(store, [
      line("gone", []),
      line("missing", []),
      line("tea", [{ groupName: "Kích cỡ", name: "XL", priceDeltaVnd: 0 }]),
      line("tea", [])
    ]);
    expect(result.lines).toEqual([]);
    expect(result.skipped).toEqual(["gone", "missing", "tea", "tea"]);
  });
});
