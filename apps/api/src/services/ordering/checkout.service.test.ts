import { ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PaymentMethod } from "../../entities/ordering/order.entity.js";
import type { CatalogRepository } from "../../repositories/catalog/catalog.repository.js";
import type { AddressRepository } from "../../repositories/ordering/address.repository.js";
import type { OrderRepository } from "../../repositories/ordering/order.repository.js";
import {
  CheckoutService,
  DELIVERY_FEE_VND,
  createOrderCode
} from "./checkout.service.js";

const STORE = "11111111-1111-4111-8111-111111111111";
const TEA = "22222222-2222-4222-8222-222222222222";
const SIZE_M = "33333333-3333-4333-8333-333333333333";
const SIZE_L = "44444444-4444-4444-8444-444444444444";
const PEARL = "55555555-5555-4555-8555-555555555555";

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: TEA,
    storeId: STORE,
    name: "Trà sữa",
    priceVnd: 45000,
    imageUrl: null,
    isAvailable: true,
    category: { isActive: true },
    optionGroups: [
      {
        name: "Kích cỡ",
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: SIZE_M, name: "M", priceDeltaVnd: 0, isAvailable: true },
          { id: SIZE_L, name: "L", priceDeltaVnd: 8000, isAvailable: true }
        ]
      },
      {
        name: "Topping",
        minSelect: 0,
        maxSelect: 1,
        options: [
          {
            id: PEARL,
            name: "Trân châu",
            priceDeltaVnd: 6000,
            isAvailable: false
          }
        ]
      }
    ],
    ...overrides
  };
}

function setup(options: { store?: object | null; products?: object[] } = {}) {
  const catalog = {
    findStore: vi.fn(async () =>
      options.store === undefined
        ? {
            id: STORE,
            name: "Mây",
            isActive: true,
            isAcceptingOrders: true,
            openingHours: null
          }
        : options.store
    ),
    findStoreProducts: vi.fn(async () => options.products ?? [product()])
  };
  const addresses = {
    find: vi.fn(async () => ({
      label: "Nhà",
      line: "12 Nguyễn Trãi",
      note: null
    }))
  };
  const orders = {
    findByIdempotencyKey: vi.fn(async () => null),
    create: vi.fn(async () => "order-id"),
    findForCustomer: vi.fn(async () => null)
  };
  const service = new CheckoutService(
    catalog as unknown as CatalogRepository,
    addresses as unknown as AddressRepository,
    orders as unknown as OrderRepository
  );
  return { service, orders };
}

const cart = (optionIds: string[], quantity = 2) => ({
  storeId: STORE,
  items: [{ productId: TEA, quantity, optionIds }]
});

describe("CheckoutService.quote", () => {
  it("prices options and quantity from the database and adds the server fee", async () => {
    const quote = await setup().service.quote(cart([SIZE_L]));
    expect(quote.lines[0]).toMatchObject({
      unitPriceVnd: 53000,
      lineTotalVnd: 106000
    });
    expect(quote.subtotalVnd).toBe(106000);
    expect(quote.totalVnd).toBe(106000 + DELIVERY_FEE_VND);
  });

  it("rejects a closed store, sold-out product, unavailable option and missing required choice", async () => {
    await expect(
      setup({ store: { id: STORE, name: "x", isActive: false } }).service.quote(
        cart([SIZE_M])
      )
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      setup({ products: [product({ isAvailable: false })] }).service.quote(
        cart([SIZE_M])
      )
    ).rejects.toThrow("vừa hết món");
    await expect(setup().service.quote(cart([SIZE_M, PEARL]))).rejects.toThrow(
      "tạm hết"
    );
    await expect(setup().service.quote(cart([]))).rejects.toThrow("chọn lại");
    await expect(setup().service.quote(cart([SIZE_M, SIZE_L]))).rejects.toThrow(
      "chọn lại"
    );
    await expect(
      setup({ products: [] }).service.quote(cart([SIZE_M]))
    ).rejects.toThrow("không còn trong thực đơn");
    await expect(
      setup({ products: [product({ archivedAt: new Date() })] }).service.quote(
        cart([SIZE_M])
      )
    ).rejects.toThrow("không còn trong thực đơn");
  });

  it("rejects a paused store and one outside its opening hours", async () => {
    const open = { id: STORE, name: "x", isActive: true, openingHours: null };
    await expect(
      setup({ store: { ...open, isAcceptingOrders: false } }).service.quote(
        cart([SIZE_M])
      )
    ).rejects.toThrow("tạm ngưng nhận đơn");
    const closedEveryDay = [
      null,
      null,
      null,
      null,
      null,
      null,
      { open: "00:00", close: "00:01" }
    ];
    await expect(
      setup({
        store: {
          ...open,
          isAcceptingOrders: true,
          openingHours: closedEveryDay
        }
      }).service.quote(cart([SIZE_M]))
    ).rejects.toThrow(ConflictException);
  });
});

describe("CheckoutService.place", () => {
  const user = { id: "user-1", phone: "+84860000001" };
  const input = {
    ...cart([SIZE_M]),
    idempotencyKey: "abcdefgh-12345678",
    addressId: "66666666-6666-4666-8666-666666666666",
    note: null,
    paymentMethod: PaymentMethod.COD
  };

  it("stores server-calculated totals and the address snapshot", async () => {
    const { service, orders } = setup();
    await expect(service.place(user, input)).rejects.toThrow();
    const [order, items] = orders.create.mock.calls[0] as unknown as [
      Record<string, unknown>,
      Record<string, unknown>[]
    ];
    expect(order).toMatchObject({
      subtotalVnd: 90000,
      deliveryFeeVnd: DELIVERY_FEE_VND,
      totalVnd: 105000,
      deliveryLine: "12 Nguyễn Trãi",
      customerPhone: user.phone,
      status: "PENDING"
    });
    expect(items[0]).toMatchObject({ unitPriceVnd: 45000, quantity: 2 });
  });

  const existing = (quantity: number) =>
    ({
      id: "existing",
      code: "TGAAAAAA",
      status: "PENDING",
      storeId: STORE,
      store: { name: "Mây", coverImageUrl: null, addressLine: "x" },
      items: [
        {
          productId: TEA,
          productName: "Trà sữa",
          imageUrl: null,
          unitPriceVnd: 45000,
          quantity,
          lineTotalVnd: 45000 * quantity,
          options: [
            {
              optionId: SIZE_M,
              groupName: "Kích cỡ",
              name: "M",
              priceDeltaVnd: 0
            }
          ]
        }
      ],
      totalVnd: 1,
      subtotalVnd: 1,
      deliveryFeeVnd: 0,
      placedAt: new Date(),
      driverUserId: null,
      acceptedAt: null,
      preparingAt: null,
      readyAt: null,
      assignedAt: null,
      pickedUpAt: null,
      deliveredAt: null,
      closedAt: null
    }) as never;

  it("returns the existing order for a repeated idempotency key without pricing again", async () => {
    const { service, orders } = setup();
    orders.findByIdempotencyKey.mockResolvedValueOnce(existing(2));
    const result = await service.place(user, input);
    expect(result.id).toBe("existing");
    expect(orders.create).not.toHaveBeenCalled();
  });

  it("refuses a repeated idempotency key that carries a different cart", async () => {
    const { service, orders } = setup();
    orders.findByIdempotencyKey.mockResolvedValueOnce(existing(5));
    await expect(service.place(user, input)).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(orders.create).not.toHaveBeenCalled();
  });
});

describe("createOrderCode", () => {
  it("creates short unambiguous codes", () => {
    expect(createOrderCode()).toMatch(/^TG[A-HJ-NP-Z2-9]{6}$/);
  });
});
