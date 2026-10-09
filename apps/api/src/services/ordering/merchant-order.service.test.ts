import {
  ConflictException,
  ForbiddenException,
  NotFoundException
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { OrderStatus } from "../../entities/ordering/order.entity.js";
import type { CatalogRepository } from "../../repositories/catalog/catalog.repository.js";
import type { OrderRepository } from "../../repositories/ordering/order.repository.js";
import {
  MERCHANT_TRANSITIONS,
  MerchantOrderService
} from "./merchant-order.service.js";

const ORDER = "77777777-7777-4777-8777-777777777777";

function setup(store: object | null, order: object | null, moved = true) {
  const orders = {
    findForStore: vi.fn(async () => order),
    transition: vi.fn(async () => moved)
  };
  const service = new MerchantOrderService(
    {
      findStoreByOwner: vi.fn(async () => store)
    } as unknown as CatalogRepository,
    orders as unknown as OrderRepository
  );
  return { service, orders };
}

describe("MerchantOrderService", () => {
  it("allows only forward store transitions", () => {
    expect(MERCHANT_TRANSITIONS).toEqual({
      accept: { from: "PENDING", to: "ACCEPTED" },
      reject: { from: "PENDING", to: "REJECTED" },
      prepare: { from: "ACCEPTED", to: "PREPARING" },
      ready: { from: "PREPARING", to: "READY_FOR_PICKUP" }
    });
  });

  it("refuses a merchant without a store", async () => {
    await expect(
      setup(null, null).service.act("u", ORDER, "accept")
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("scopes the transition to the merchant's own store", async () => {
    const { service, orders } = setup({ id: "store-a" }, null);
    await expect(service.act("u", ORDER, "accept")).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(orders.findForStore).toHaveBeenCalledWith(ORDER, "store-a");
    expect(orders.transition).not.toHaveBeenCalled();
  });

  it("reports a lost race as a conflict", async () => {
    const { service, orders } = setup(
      { id: "store-a" },
      { id: ORDER, status: OrderStatus.ACCEPTED },
      false
    );
    await expect(service.act("u", ORDER, "accept")).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(orders.transition).toHaveBeenCalledWith(
      ORDER,
      [OrderStatus.PENDING],
      OrderStatus.ACCEPTED,
      { storeId: "store-a" },
      {}
    );
  });
});
