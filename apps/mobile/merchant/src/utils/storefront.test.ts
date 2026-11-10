import { describe, expect, it } from "vitest";

import type {
  MerchantCatalog,
  MerchantStoreProfile,
  StoreOverview
} from "../types/storefront";
import {
  findProduct,
  initialOf,
  isLikelyStorePhone,
  optionLabel,
  patchProduct,
  productPosition,
  profileChanges,
  profileDraft,
  profileInput,
  publishBlockers,
  setupProgress,
  storeStatus,
  toLocalPhone,
  validateProfile
} from "./storefront";

const store = (
  patch: Partial<MerchantStoreProfile> = {}
): MerchantStoreProfile => ({
  id: "s",
  name: "Cơm Tấm",
  category: "FOOD",
  description: null,
  addressLine: "84 Đinh Tiên Hoàng",
  phone: "+84901234567",
  logoImageUrl: null,
  coverImageUrl: null,
  isPublished: true,
  isAcceptingOrders: true,
  openingHours: null,
  isOpenNow: true,
  closedReason: null,
  ...patch
});

const overview = (patch: Partial<StoreOverview> = {}): StoreOverview => ({
  store: store(),
  setup: [],
  catalog: {
    categoryCount: 1,
    productCount: 1,
    availableCount: 1,
    unavailableCount: 0
  },
  canPublish: true,
  ...patch
});

describe("storeStatus", () => {
  it("follows the server's closed reason", () => {
    expect(storeStatus(store()).label).toBe("Đang mở");
    expect(storeStatus(store({ closedReason: "PAUSED" })).label).toBe(
      "Tạm ngưng"
    );
    expect(storeStatus(store({ closedReason: "OUTSIDE_HOURS" })).label).toBe(
      "Ngoài giờ"
    );
    expect(storeStatus(store({ closedReason: "UNPUBLISHED" })).label).toBe(
      "Chưa hiển thị"
    );
  });

  it("derives a reason from flags when none is given", () => {
    expect(storeStatus(store({ isPublished: false })).key).toBe("UNPUBLISHED");
    expect(storeStatus(store({ isAcceptingOrders: false })).key).toBe("PAUSED");
    expect(storeStatus(store({ isOpenNow: false })).key).toBe("OUTSIDE_HOURS");
  });
});

describe("setup helpers", () => {
  it("counts completed steps", () => {
    expect(
      setupProgress([
        { key: "PROFILE", label: "", done: true, required: true },
        { key: "MENU", label: "", done: false, required: true }
      ])
    ).toEqual({ done: 1, total: 2, complete: false });
  });

  it("explains why publishing is blocked", () => {
    expect(publishBlockers(overview())).toEqual([]);
    expect(
      publishBlockers(
        overview({
          canPublish: false,
          store: store({ phone: null }),
          catalog: {
            categoryCount: 1,
            productCount: 0,
            availableCount: 0,
            unavailableCount: 0
          }
        })
      )
    ).toEqual([
      "Thêm số điện thoại cửa hàng.",
      "Thêm ít nhất một món đang bán."
    ]);
    expect(publishBlockers(overview({ canPublish: false }))).toHaveLength(1);
  });
});

describe("store profile", () => {
  it("accepts mobile and landline numbers", () => {
    expect(isLikelyStorePhone("0901 234 567")).toBe(true);
    expect(isLikelyStorePhone("+84901234567")).toBe(true);
    expect(isLikelyStorePhone("028 3822 1234")).toBe(true);
    expect(isLikelyStorePhone("0101234567")).toBe(false);
  });

  it("shows canonical numbers in local form", () => {
    expect(toLocalPhone("+84901234567")).toBe("0901 234 567");
    expect(toLocalPhone("+842838221234")).toBe("028 3822 1234");
    expect(toLocalPhone(null)).toBe("");
  });

  it("validates the setup form", () => {
    const empty = profileDraft(null);
    expect(Object.keys(validateProfile(empty)).sort()).toEqual([
      "addressLine",
      "category",
      "name",
      "phone"
    ]);
    expect(validateProfile(profileDraft(store()))).toEqual({});
  });
});

describe("catalog helpers", () => {
  const product = (id: string, isAvailable = true) => ({
    id,
    categoryId: "c",
    name: id,
    description: null,
    priceVnd: 35000,
    imageUrl: null,
    isAvailable,
    optionGroupCount: 0
  });
  const catalog: MerchantCatalog = {
    categories: [
      {
        id: "c",
        name: "Cơm",
        isActive: true,
        products: [product("a"), product("b")]
      }
    ]
  };

  it("finds and patches a product without touching others", () => {
    const next = patchProduct(catalog, "b", { isAvailable: false });
    expect(findProduct(next, "b")?.isAvailable).toBe(false);
    expect(findProduct(next, "a")?.isAvailable).toBe(true);
    expect(findProduct(catalog, "b")?.isAvailable).toBe(true);
  });

  it("locates a product within its category", () => {
    expect(productPosition(catalog, "b")).toEqual({ index: 1, count: 2 });
    expect(productPosition(catalog, "x")).toBeUndefined();
  });

  it("labels options and initials", () => {
    expect(optionLabel(2)).toBe("2 tuỳ chọn");
    expect(optionLabel(0)).toBeUndefined();
    expect(initialOf(" ếch chiên")).toBe("Ế");
  });
});

describe("profile bodies", () => {
  it("trims the create body and omits an empty description", () => {
    expect(
      profileInput({
        name: "  Quán Ba ",
        category: "COFFEE",
        addressLine: " 12 Lê Lợi ",
        phone: "0901 234 567",
        description: "  "
      })
    ).toEqual({
      name: "Quán Ba",
      category: "COFFEE",
      addressLine: "12 Lê Lợi",
      phone: "0901234567"
    });
  });

  it("sends only changed fields on edit", () => {
    const current = store({ description: "Ngon" });
    expect(profileChanges(profileDraft(current), current)).toEqual({});
    expect(
      profileChanges(
        { ...profileDraft(current), name: "Cơm Tấm Mới", description: "" },
        current
      )
    ).toEqual({ name: "Cơm Tấm Mới", description: null });
    expect(
      profileChanges(
        { ...profileDraft(store({ phone: null })), phone: "0901234567" },
        store({ phone: null })
      )
    ).toEqual({ phone: "0901234567" });
  });
});
