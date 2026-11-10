export type Address = {
  id: string;
  label: string;
  line: string;
  note: string | null;
  isDefault: boolean;
};

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED";

export type OrderLine = {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceVnd: number;
  lineTotalVnd: number;
  options: { groupName: string; name: string; priceDeltaVnd: number }[];
};

export type Quote = {
  storeId: string;
  storeName: string;
  lines: OrderLine[];
  subtotalVnd: number;
  deliveryFeeVnd: number;
  totalVnd: number;
};

export type OrderSummary = {
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
};

export type OrderDetail = OrderSummary & {
  paymentMethod: "COD";
  subtotalVnd: number;
  deliveryFeeVnd: number;
  items: OrderLine[];
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
};

export type CustomerHomeResponse = {
  shortcuts: { key: "FOOD" | "COFFEE" | "MILK_TEA"; label: string }[];
  defaultAddress: Address | null;
  recentOrder: OrderSummary | null;
};

export type CartItemInput = {
  productId: string;
  quantity: number;
  optionIds: string[];
};
