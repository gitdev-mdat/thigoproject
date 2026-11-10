import type { MerchantOrder, OrderAction, OrderBoard } from "../types/orders";
import { apiRequest } from "./api";

export function fetchOrderBoard(): Promise<OrderBoard> {
  return apiRequest<OrderBoard>("/merchant/orders");
}

/** Moves one order forward; the API answers 409 when it already moved. */
export function runOrderAction(
  orderId: string,
  action: OrderAction,
  reason?: string
): Promise<MerchantOrder> {
  return apiRequest<MerchantOrder>(
    `/merchant/orders/${encodeURIComponent(orderId)}/${action}`,
    {
      method: "POST",
      ...(action === "reject" ? { body: { reason } } : {})
    }
  );
}
