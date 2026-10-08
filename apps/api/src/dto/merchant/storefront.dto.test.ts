import { describe, expect, it } from "vitest";
import {
  parseOpeningHours,
  parseProduct,
  parseProductUpdate,
  parseStorePhone,
  parseStoreProfile,
  parseStoreUpdate
} from "./storefront.dto.js";

const CATEGORY = "11111111-1111-4111-8111-111111111111";

describe("storefront input", () => {
  it("normalises a store profile and phone numbers", () => {
    expect(
      parseStoreProfile({
        name: "  Cà Phê   Mộc ",
        category: "COFFEE",
        addressLine: "45 Lê Lợi, Q.1",
        phone: "0901 234 567"
      })
    ).toEqual({
      name: "Cà Phê Mộc",
      category: "COFFEE",
      description: null,
      addressLine: "45 Lê Lợi, Q.1",
      phone: "+84901234567"
    });
    expect(parseStorePhone("(028) 3822-1234")).toBe("+842838221234");
    expect(() => parseStorePhone("12345")).toThrow("không hợp lệ");
  });

  it("rejects an unknown store type and empty updates", () => {
    expect(() =>
      parseStoreProfile({
        name: "Quán",
        category: "BAR",
        addressLine: "45 Lê Lợi",
        phone: "0901234567"
      })
    ).toThrow("loại cửa hàng");
    expect(() => parseStoreUpdate({})).toThrow("Không có thay đổi");
    expect(() => parseStoreUpdate({ logoMediaId: "x" })).toThrow("Ảnh");
    expect(parseStoreUpdate({ logoMediaId: null })).toEqual({
      logoMediaId: null
    });
  });

  it("accepts only whole-đồng prices in range", () => {
    const base = { name: "Bạc xỉu", categoryId: CATEGORY };
    expect(parseProduct({ ...base, priceVnd: 32000 }).priceVnd).toBe(32000);
    for (const priceVnd of [32000.5, "32000", 999, 10_000_001, -1, Number.NaN])
      expect(() => parseProduct({ ...base, priceVnd })).toThrow("Giá");
    expect(() =>
      parseProduct({ ...base, categoryId: "x", priceVnd: 1000 })
    ).toThrow("danh mục");
    expect(parseProductUpdate({ isAvailable: false })).toEqual({
      isAvailable: false
    });
    expect(() => parseProductUpdate({ isAvailable: "no" })).toThrow();
  });

  it("validates opening hours as seven same-day windows", () => {
    const day = { open: "06:30", close: "22:00" };
    expect(parseOpeningHours({ hours: Array(7).fill(day) })).toHaveLength(7);
    expect(parseOpeningHours({ hours: null })).toBeNull();
    expect(() => parseOpeningHours({ hours: [day] })).toThrow("7 ngày");
    expect(() =>
      parseOpeningHours({
        hours: Array(7).fill({ open: "22:00", close: "06:00" })
      })
    ).toThrow("sau giờ mở cửa");
    expect(() =>
      parseOpeningHours({
        hours: Array(7).fill({ open: "7:00", close: "21:00" })
      })
    ).toThrow("HH:MM");
    expect(() => parseOpeningHours({ hours: Array(7).fill(null) })).toThrow(
      "ít nhất một ngày"
    );
  });
});
