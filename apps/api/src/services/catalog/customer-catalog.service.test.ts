import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { StoreCategory } from "../../entities/catalog/store.entity.js";
import type { CatalogRepository } from "../../repositories/catalog/catalog.repository.js";
import { CustomerCatalogService } from "./customer-catalog.service.js";

const STORE_ID = "563b7d0c-6e8c-4b84-8e09-daeaaa31be8d";

function store(overrides: Record<string, unknown> = {}) {
  return {
    id: STORE_ID,
    name: "Trà Sữa Mây",
    category: StoreCategory.MILK_TEA,
    description: null,
    addressLine: "210 Nguyễn Thị Minh Khai",
    coverImageUrl: null,
    categories: [],
    ...overrides
  };
}

function product(name: string, isAvailable = true) {
  return {
    id: `${name}-id`,
    name,
    description: null,
    priceVnd: 45000,
    imageUrl: null,
    isAvailable,
    optionGroups: []
  };
}

function service(repository: Partial<CatalogRepository>) {
  return new CustomerCatalogService(repository as CatalogRepository);
}

describe("CustomerCatalogService", () => {
  it("only recommends stores that have something to order", async () => {
    const result = await service({
      listActiveStores: vi.fn(async () => [
        { store: store() as never, productCount: 3 },
        { store: store({ id: "empty" }) as never, productCount: 0 }
      ]),
      listAvailableProducts: vi.fn(async () => [])
    }).recommendations(StoreCategory.MILK_TEA);

    expect(result.stores.map((item) => item.id)).toEqual([STORE_ID]);
  });

  it("folds Vietnamese search text before querying", async () => {
    const listActiveStores = vi.fn(async () => []);
    const listAvailableProducts = vi.fn(async () => []);
    await service({ listActiveStores, listAvailableProducts }).search(
      "  Trà Sữa  "
    );

    expect(listActiveStores).toHaveBeenCalledWith({ foldedQuery: "tra sua" });
  });

  it("returns nothing for a blank search without querying", async () => {
    const listActiveStores = vi.fn();
    const result = await service({ listActiveStores }).search("   ");

    expect(result).toEqual({ query: "", stores: [], dishes: [] });
    expect(listActiveStores).not.toHaveBeenCalled();
  });

  it("rejects malformed and unknown store ids with 404", async () => {
    const findActiveStoreMenu = vi.fn(async () => null);
    const catalog = service({ findActiveStoreMenu });

    await expect(catalog.store("1 OR 1=1")).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(findActiveStoreMenu).not.toHaveBeenCalled();
    await expect(catalog.store(STORE_ID)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it("hides inactive categories and reports a store with nothing available as closed", async () => {
    const result = await service({
      findActiveStoreMenu: vi.fn(
        async () =>
          store({
            categories: [
              {
                id: "a",
                name: "Trà sữa",
                isActive: true,
                products: [product("A", false)]
              },
              { id: "b", name: "Ẩn", isActive: false, products: [product("B")] }
            ]
          }) as never
      )
    }).store(STORE_ID);

    expect(result.categories.map((category) => category.name)).toEqual([
      "Trà sữa"
    ]);
    expect(result.isOpen).toBe(false);
    expect(result.productCount).toBe(0);
  });
});
