import { describe, expect, it, vi } from "vitest";
import {
  DEVELOPMENT_STORE_FIXTURES,
  seedDevelopmentCatalog
} from "./catalog-fixtures.js";

const products = DEVELOPMENT_STORE_FIXTURES.flatMap((store) =>
  store.categories.flatMap((category) => category.products)
);

describe("development catalog fixtures", () => {
  it("gives every merchant at most one store and every store a unique slug", () => {
    const owners = DEVELOPMENT_STORE_FIXTURES.map((store) => store.ownerPhone);
    const slugs = DEVELOPMENT_STORE_FIXTURES.map((store) => store.slug);
    expect(new Set(owners).size).toBe(owners.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(owners[0]).toBe("0860000002");
  });

  it("covers food, coffee and milk tea", () => {
    expect(
      new Set(DEVELOPMENT_STORE_FIXTURES.map((store) => store.category))
    ).toEqual(new Set(["FOOD", "COFFEE", "MILK_TEA"]));
  });

  it("uses whole-đồng prices and valid option ranges", () => {
    for (const product of products) {
      expect(Number.isInteger(product.priceVnd)).toBe(true);
      expect(product.priceVnd).toBeGreaterThan(0);
      for (const group of product.options ?? []) {
        expect(group.minSelect).toBeLessThanOrEqual(group.maxSelect);
        expect(group.maxSelect).toBeLessThanOrEqual(group.options.length);
        for (const option of group.options)
          expect(Number.isInteger(option.priceDeltaVnd)).toBe(true);
      }
    }
  });

  it("writes stores, categories, products and options through upserts", async () => {
    let id = 0;
    const next = () => vi.fn(async () => `id-${++id}`);
    const writer = {
      ensureMerchant: next(),
      upsertStore: next(),
      upsertCategory: next(),
      upsertProduct: next(),
      upsertOptionGroup: next(),
      upsertOption: vi.fn(async () => undefined)
    };

    await seedDevelopmentCatalog(writer);

    expect(writer.upsertStore).toHaveBeenCalledTimes(
      DEVELOPMENT_STORE_FIXTURES.length
    );
    expect(writer.upsertProduct).toHaveBeenCalledTimes(products.length);
    expect(writer.upsertStore).toHaveBeenNthCalledWith(
      1,
      DEVELOPMENT_STORE_FIXTURES[0],
      expect.any(String),
      "/media/dev/cover-com-tam.png"
    );
  });
});

describe("development media", () => {
  it("ships an image for every seeded cover and product", async () => {
    const { existsSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const root = fileURLToPath(new URL("../../dev-media/", import.meta.url));
    const names = new Set([
      ...DEVELOPMENT_STORE_FIXTURES.map((store) => `cover-${store.cover}`),
      ...products.map((product) => product.image)
    ]);
    for (const name of names)
      expect(existsSync(`${root}${name}.png`)).toBe(true);
  });
});
