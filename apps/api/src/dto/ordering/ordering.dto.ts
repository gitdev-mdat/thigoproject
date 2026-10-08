import { BadRequestException } from "@nestjs/common";
import {
  OrderStatus,
  PaymentMethod
} from "../../entities/ordering/order.entity.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function invalid(message = "Dữ liệu gửi lên không hợp lệ."): never {
  throw new BadRequestException(message);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function optionalText(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") invalid();
  const text = value.trim();
  if (text.length > max) invalid(`Nội dung tối đa ${max} ký tự.`);
  return text || null;
}

function requiredText(
  value: unknown,
  min: number,
  max: number,
  label: string
): string {
  const text = optionalText(value, max);
  if (!text || text.length < min) invalid(`${label} cần ít nhất ${min} ký tự.`);
  return text;
}

// ---- Addresses ----

export interface AddressInput {
  label: string;
  line: string;
  note: string | null;
  makeDefault: boolean;
}

export function parseAddressInput(body: unknown): AddressInput {
  const value = record(body);
  return {
    label: requiredText(value.label, 1, 40, "Tên địa chỉ"),
    line: requiredText(value.line, 5, 255, "Địa chỉ"),
    note: optionalText(value.note, 255),
    makeDefault: value.makeDefault === true
  };
}

export interface AddressDto {
  id: string;
  label: string;
  line: string;
  note: string | null;
  isDefault: boolean;
}

// ---- Checkout ----

export interface CartItemInput {
  productId: string;
  quantity: number;
  optionIds: string[];
}

export interface CartInput {
  storeId: string;
  items: CartItemInput[];
}

export const MAX_CART_LINES = 30;
export const MAX_LINE_QUANTITY = 20;

export function parseCartInput(body: unknown): CartInput {
  const value = record(body);
  if (!isUuid(value.storeId)) invalid("Cửa hàng không hợp lệ.");
  if (
    !Array.isArray(value.items) ||
    value.items.length === 0 ||
    value.items.length > MAX_CART_LINES
  )
    invalid("Giỏ hàng không hợp lệ.");
  const items = value.items.map((raw) => {
    const item = record(raw);
    if (!isUuid(item.productId)) invalid("Món không hợp lệ.");
    if (
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_LINE_QUANTITY
    )
      invalid(`Số lượng mỗi món từ 1 đến ${MAX_LINE_QUANTITY}.`);
    const optionIds = item.optionIds ?? [];
    if (
      !Array.isArray(optionIds) ||
      optionIds.length > 20 ||
      !optionIds.every(isUuid) ||
      new Set(optionIds).size !== optionIds.length
    )
      invalid("Tuỳ chọn không hợp lệ.");
    return {
      productId: item.productId,
      quantity: item.quantity,
      optionIds: optionIds as string[]
    };
  });
  return { storeId: value.storeId, items };
}

export interface PlaceOrderInput extends CartInput {
  idempotencyKey: string;
  addressId: string;
  note: string | null;
  paymentMethod: PaymentMethod;
}

export function parsePlaceOrderInput(body: unknown): PlaceOrderInput {
  const value = record(body);
  const cart = parseCartInput(body);
  if (
    typeof value.idempotencyKey !== "string" ||
    !/^[A-Za-z0-9-]{16,64}$/.test(value.idempotencyKey)
  )
    invalid("Thiếu mã chống trùng đơn.");
  if (!isUuid(value.addressId)) invalid("Vui lòng chọn địa chỉ giao hàng.");
  if (value.paymentMethod !== PaymentMethod.COD)
    invalid("Hiện chỉ hỗ trợ thanh toán khi nhận hàng.");
  return {
    ...cart,
    idempotencyKey: value.idempotencyKey,
    addressId: value.addressId,
    note: optionalText(value.note, 500),
    paymentMethod: PaymentMethod.COD
  };
}

export function parseRejectReason(body: unknown): string {
  const value = record(body ?? {});
  return requiredText(value.reason, 3, 255, "Lý do từ chối");
}

export interface QuoteLineDto {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceVnd: number;
  lineTotalVnd: number;
  options: {
    optionId?: string;
    groupName: string;
    name: string;
    priceDeltaVnd: number;
  }[];
}

export interface QuoteDto {
  storeId: string;
  storeName: string;
  lines: QuoteLineDto[];
  subtotalVnd: number;
  deliveryFeeVnd: number;
  totalVnd: number;
}

// ---- Orders ----

export interface OrderSummaryDto {
  id: string;
  code: string;
  status: OrderStatus;
  storeId: string;
  storeName: string;
  storeImageUrl: string | null;
  itemCount: number;
  itemsPreview: string;
  totalVnd: number;
  placedAt: string;
  driverAssigned: boolean;
}

export interface OrderDetailDto extends OrderSummaryDto {
  paymentMethod: PaymentMethod;
  subtotalVnd: number;
  deliveryFeeVnd: number;
  items: QuoteLineDto[];
  customerNote: string | null;
  rejectReason: string | null;
  delivery: { label: string; line: string; note: string | null };
  storeAddressLine: string;
  timeline: {
    placedAt: string;
    acceptedAt: string | null;
    preparingAt: string | null;
    readyAt: string | null;
    assignedAt: string | null;
    pickedUpAt: string | null;
    deliveredAt: string | null;
    closedAt: string | null;
  };
}

/** What a driver needs; the merchant view omits the customer's address and phone. */
export interface DeliveryDto extends OrderDetailDto {
  customerPhone: string | null;
}
