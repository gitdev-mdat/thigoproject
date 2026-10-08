import { randomInt } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type {
  CartInput,
  OrderDetailDto,
  PlaceOrderInput,
  QuoteDto,
  QuoteLineDto
} from "../../dto/ordering/ordering.dto.js";
import { OrderStatus } from "../../entities/ordering/order.entity.js";
import type { AuthenticatedUser } from "../../guards/role.guard.js";
import { CatalogRepository } from "../../repositories/catalog/catalog.repository.js";
import { AddressRepository } from "../../repositories/ordering/address.repository.js";
import { OrderRepository } from "../../repositories/ordering/order.repository.js";
import { toOrderDetail } from "./order-mapper.js";

/** Flat MVP delivery fee in whole đồng, set by the server, never by the client. */
export const DELIVERY_FEE_VND = 15000;
const MAX_ORDER_TOTAL_VND = 50_000_000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createOrderCode(): string {
  let code = "TG";
  for (let index = 0; index < 6; index += 1)
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly catalog: CatalogRepository,
    private readonly addresses: AddressRepository,
    private readonly orders: OrderRepository
  ) {}

  /** Prices a cart from the database; any change since browsing is a 409 the customer can act on. */
  async quote(cart: CartInput): Promise<QuoteDto> {
    const store = await this.catalog.findStore(cart.storeId);
    if (!store || !store.isActive)
      throw new ConflictException("Quán hiện không nhận đơn.");
    const products = new Map(
      (
        await this.catalog.findStoreProducts(store.id, [
          ...new Set(cart.items.map((item) => item.productId))
        ])
      ).map((product) => [product.id, product])
    );
    const lines: QuoteLineDto[] = cart.items.map((item) => {
      const product = products.get(item.productId);
      if (!product)
        throw new ConflictException(
          "Một món trong giỏ không còn trong thực đơn. Vui lòng xem lại giỏ hàng."
        );
      if (!product.isAvailable || !product.category.isActive)
        throw new ConflictException(`${product.name} vừa hết món.`);
      const chosen = new Set(item.optionIds);
      const options: QuoteLineDto["options"] = [];
      for (const group of product.optionGroups) {
        const picked = group.options.filter((option) => chosen.has(option.id));
        for (const option of picked) {
          chosen.delete(option.id);
          if (!option.isAvailable)
            throw new ConflictException(
              `${option.name} của ${product.name} tạm hết.`
            );
          options.push({
            groupName: group.name,
            name: option.name,
            priceDeltaVnd: option.priceDeltaVnd
          });
        }
        if (picked.length < group.minSelect || picked.length > group.maxSelect)
          throw new ConflictException(
            `Tuỳ chọn của ${product.name} đã thay đổi. Vui lòng chọn lại.`
          );
      }
      if (chosen.size)
        throw new ConflictException(
          `Tuỳ chọn của ${product.name} đã thay đổi. Vui lòng chọn lại.`
        );
      const unitPriceVnd = options.reduce(
        (sum, option) => sum + option.priceDeltaVnd,
        product.priceVnd
      );
      return {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity: item.quantity,
        unitPriceVnd,
        lineTotalVnd: unitPriceVnd * item.quantity,
        options
      };
    });
    const subtotalVnd = lines.reduce((sum, line) => sum + line.lineTotalVnd, 0);
    if (subtotalVnd + DELIVERY_FEE_VND > MAX_ORDER_TOTAL_VND)
      throw new BadRequestException("Giá trị đơn vượt quá giới hạn.");
    return {
      storeId: store.id,
      storeName: store.name,
      lines,
      subtotalVnd,
      deliveryFeeVnd: DELIVERY_FEE_VND,
      totalVnd: subtotalVnd + DELIVERY_FEE_VND
    };
  }

  /**
   * Places a COD order with server-calculated totals. Repeating the same
   * idempotency key returns the original order instead of creating another.
   */
  async place(
    user: AuthenticatedUser,
    input: PlaceOrderInput
  ): Promise<OrderDetailDto> {
    const previous = await this.orders.findByIdempotencyKey(
      user.id,
      input.idempotencyKey
    );
    if (previous) return toOrderDetail(previous);
    const address = await this.addresses.find(input.addressId, user.id);
    if (!address)
      throw new BadRequestException("Vui lòng chọn địa chỉ giao hàng.");
    const quote = await this.quote(input);
    const id = await this.orders.create(
      {
        customerUserId: user.id,
        storeId: quote.storeId,
        status: OrderStatus.PENDING,
        paymentMethod: input.paymentMethod,
        subtotalVnd: quote.subtotalVnd,
        deliveryFeeVnd: quote.deliveryFeeVnd,
        totalVnd: quote.totalVnd,
        customerPhone: user.phone,
        deliveryLabel: address.label,
        deliveryLine: address.line,
        deliveryNote: address.note,
        customerNote: input.note,
        idempotencyKey: input.idempotencyKey
      },
      quote.lines.map((line, position) => ({
        productId: line.productId,
        productName: line.name,
        imageUrl: line.imageUrl,
        unitPriceVnd: line.unitPriceVnd,
        quantity: line.quantity,
        lineTotalVnd: line.lineTotalVnd,
        options: line.options,
        position
      })),
      createOrderCode
    );
    const order = id
      ? await this.orders.findForCustomer(id, user.id)
      : await this.orders.findByIdempotencyKey(user.id, input.idempotencyKey);
    if (!order) throw new NotFoundException();
    return toOrderDetail(order);
  }
}
