import type {
  Address,
  CartItemInput,
  OrderDetail,
  OrderSummary,
  Quote
} from "../types/orders";
import { apiRequest } from "./api";

export type AddressInput = {
  label: string;
  line: string;
  note: string;
  makeDefault: boolean;
};

export const ordersApi = {
  addresses: () => apiRequest<{ addresses: Address[] }>("/customer/addresses"),
  createAddress: (input: AddressInput) =>
    apiRequest<Address>("/customer/addresses", { method: "POST", body: input }),
  makeDefault: (id: string) =>
    apiRequest<Address>(`/customer/addresses/${id}/default`, {
      method: "POST"
    }),
  quote: (storeId: string, items: CartItemInput[]) =>
    apiRequest<Quote>("/customer/checkout/quote", {
      method: "POST",
      body: { storeId, items }
    }),
  place: (body: {
    idempotencyKey: string;
    storeId: string;
    addressId: string;
    note: string;
    paymentMethod: "COD";
    items: CartItemInput[];
  }) => apiRequest<OrderDetail>("/customer/orders", { method: "POST", body }),
  list: () => apiRequest<{ orders: OrderSummary[] }>("/customer/orders"),
  detail: (id: string) => apiRequest<OrderDetail>(`/customer/orders/${id}`),
  cancel: (id: string) =>
    apiRequest<OrderDetail>(`/customer/orders/${id}/cancel`, {
      method: "POST"
    })
};
