import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { parseAddressInput, parsePlaceOrderInput } from "./ordering.dto.js";

const STORE = "11111111-1111-4111-8111-111111111111";
const PRODUCT = "22222222-2222-4222-8222-222222222222";
const ADDRESS = "33333333-3333-4333-8333-333333333333";

const valid = {
  idempotencyKey: "abcdefgh-12345678",
  storeId: STORE,
  addressId: ADDRESS,
  paymentMethod: "COD",
  items: [{ productId: PRODUCT, quantity: 1, optionIds: [] }]
};

describe("parsePlaceOrderInput", () => {
  it("accepts a COD order and drops client totals", () => {
    const parsed = parsePlaceOrderInput({ ...valid, totalVnd: 1 });
    expect(parsed).not.toHaveProperty("totalVnd");
    expect(parsed.items[0]).toEqual({
      productId: PRODUCT,
      quantity: 1,
      optionIds: []
    });
  });

  it.each([
    ["non-COD payment", { paymentMethod: "CARD" }],
    ["missing idempotency key", { idempotencyKey: "x" }],
    ["fractional quantity", { items: [{ productId: PRODUCT, quantity: 1.5 }] }],
    ["empty cart", { items: [] }],
    [
      "duplicate options",
      {
        items: [
          { productId: PRODUCT, quantity: 1, optionIds: [ADDRESS, ADDRESS] }
        ]
      }
    ],
    ["malformed address id", { addressId: "1 OR 1=1" }]
  ])("rejects %s", (_, patch) => {
    expect(() => parsePlaceOrderInput({ ...valid, ...patch })).toThrow(
      BadRequestException
    );
  });
});

describe("parseAddressInput", () => {
  it("trims values and requires a usable address line", () => {
    expect(
      parseAddressInput({ label: " Nhà ", line: " 12 Nguyễn Trãi " })
    ).toEqual({
      label: "Nhà",
      line: "12 Nguyễn Trãi",
      note: null,
      makeDefault: false
    });
    expect(() => parseAddressInput({ label: "Nhà", line: "12" })).toThrow(
      BadRequestException
    );
  });
});
