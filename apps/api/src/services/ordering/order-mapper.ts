import type {
  DeliveryDto,
  OrderDetailDto,
  OrderSummaryDto,
  QuoteLineDto
} from "../../dto/ordering/ordering.dto.js";
import type { Order } from "../../entities/ordering/order.entity.js";

const iso = (date: Date | null) => (date ? date.toISOString() : null);

export function toOrderSummary(order: Order): OrderSummaryDto {
  const items = order.items ?? [];
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    storeId: order.storeId,
    storeName: order.store.name,
    storeImageUrl: order.store.coverImageUrl,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    itemsPreview: items
      .map((item) => `${item.quantity}× ${item.productName}`)
      .join(", "),
    totalVnd: order.totalVnd,
    placedAt: order.placedAt.toISOString(),
    driverAssigned: order.driverUserId !== null
  };
}

export function toOrderLines(order: Order): QuoteLineDto[] {
  return (order.items ?? []).map((item) => ({
    productId: item.productId ?? "",
    name: item.productName,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    unitPriceVnd: item.unitPriceVnd,
    lineTotalVnd: item.lineTotalVnd,
    options: item.options
  }));
}

export function toOrderDetail(order: Order): OrderDetailDto {
  return {
    ...toOrderSummary(order),
    paymentMethod: order.paymentMethod,
    subtotalVnd: order.subtotalVnd,
    deliveryFeeVnd: order.deliveryFeeVnd,
    items: toOrderLines(order),
    customerNote: order.customerNote,
    rejectReason: order.rejectReason,
    delivery: {
      label: order.deliveryLabel,
      line: order.deliveryLine,
      note: order.deliveryNote
    },
    storeAddressLine: order.store.addressLine,
    timeline: {
      placedAt: order.placedAt.toISOString(),
      acceptedAt: iso(order.acceptedAt),
      preparingAt: iso(order.preparingAt),
      readyAt: iso(order.readyAt),
      assignedAt: iso(order.assignedAt),
      pickedUpAt: iso(order.pickedUpAt),
      deliveredAt: iso(order.deliveredAt),
      closedAt: iso(order.closedAt)
    }
  };
}

/** Merchants prepare food; they do not need where or whom it goes to. */
export function toMerchantOrder(order: Order): OrderDetailDto {
  const detail = toOrderDetail(order);
  return { ...detail, delivery: { label: "", line: "", note: null } };
}

/** A driver sees the customer's phone only once the delivery is theirs. */
export function toDelivery(
  order: Order,
  assignedToViewer: boolean
): DeliveryDto {
  return {
    ...toOrderDetail(order),
    customerPhone: assignedToViewer ? order.customerPhone : null
  };
}
