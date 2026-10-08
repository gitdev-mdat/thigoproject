import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { MediaRepository } from "../../repositories/media/media.repository.js";
import type { MediaFileStore } from "../../repositories/media/media-file.store.js";
import type { StorefrontRepository } from "../../repositories/merchant/storefront.repository.js";
import { MediaService } from "../media/media.service.js";
import { MerchantCatalogService } from "./merchant-catalog.service.js";
import {
  StorefrontService,
  canPublish,
  storeSlug
} from "./storefront.service.js";

const STORE = {
  id: "store-a",
  phone: "+84901234567",
  addressLine: "1 Lê Lợi",
  isActive: false
};
const CATEGORY = "11111111-1111-4111-8111-111111111111";
const MEDIA = "22222222-2222-4222-8222-222222222222";
const counts = (orderableCount: number) => ({
  categoryCount: 1,
  productCount: orderableCount,
  availableCount: orderableCount,
  orderableCount
});

function setup(store: object | null = STORE) {
  const repo = {
    findStoreByOwner: vi.fn(async () => store),
    findCategory: vi.fn(async () => null),
    findProduct: vi.fn(async () => null),
    createProduct: vi.fn(),
    updateStore: vi.fn(),
    counts: vi.fn(async () => counts(0))
  };
  const media = { findForStore: vi.fn(async () => null) };
  const mediaService = new MediaService(
    media as unknown as MediaRepository,
    {} as MediaFileStore,
    repo as unknown as StorefrontRepository
  );
  const stores = new StorefrontService(
    repo as unknown as StorefrontRepository,
    mediaService
  );
  const catalog = new MerchantCatalogService(
    repo as unknown as StorefrontRepository,
    stores,
    mediaService
  );
  return { repo, media, stores, catalog };
}

describe("merchant catalog ownership", () => {
  it("looks up categories and products only inside the merchant's own store", async () => {
    const { repo, catalog } = setup();
    await expect(
      catalog.createProduct("user-a", {
        name: "Bạc xỉu",
        categoryId: CATEGORY,
        description: null,
        priceVnd: 32000,
        isAvailable: true,
        imageMediaId: null
      })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findCategory).toHaveBeenCalledWith("store-a", CATEGORY);
    expect(repo.createProduct).not.toHaveBeenCalled();
    await expect(
      catalog.updateProduct("user-a", "not-a-uuid", { priceVnd: 1000 })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findProduct).not.toHaveBeenCalled();
  });

  it("refuses to attach an image the store did not upload", async () => {
    const { media, repo, stores } = setup();
    await expect(
      stores.update("user-a", { logoMediaId: MEDIA })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(media.findForStore).toHaveBeenCalledWith(MEDIA, "store-a");
    expect(repo.updateStore).not.toHaveBeenCalled();
  });

  it("returns 404 for every catalog call when the merchant has no store", async () => {
    const { catalog } = setup(null);
    await expect(catalog.catalog("user-b")).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});

describe("store publication", () => {
  it("needs a phone, an address and an orderable product", async () => {
    expect(canPublish(STORE as never, counts(1))).toBe(true);
    expect(canPublish({ ...STORE, phone: null } as never, counts(1))).toBe(
      false
    );
    expect(canPublish(STORE as never, counts(0))).toBe(false);
    const { repo, stores } = setup();
    await expect(stores.setPublished("user-a", true)).rejects.toThrow(
      "ít nhất một món"
    );
    expect(repo.updateStore).not.toHaveBeenCalled();
  });

  it("builds readable unique slugs", () => {
    expect(storeSlug("Cà Phê Mộc 1975")).toMatch(
      /^ca-phe-moc-1975-[0-9a-f]{6}$/
    );
    expect(storeSlug("!!!")).toMatch(/^cua-hang-[0-9a-f]{6}$/);
  });
});
