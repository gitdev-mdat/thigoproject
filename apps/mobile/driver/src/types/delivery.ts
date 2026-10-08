/** Mirrors the API's order status; the server is the authority on transitions. */
export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED";

export type DeliveryItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceVnd: number;
  lineTotalVnd: number;
  options: { groupName: string; name: string; priceDeltaVnd: number }[];
};

/** `GET /driver/deliveries` entry: an order detail plus the customer's phone once claimed. */
export type Delivery = {
  id: string;
  code: string;
  status: OrderStatus;
  storeId: string;
  storeName: string;
  storeImageUrl: string | null;
  storeAddressLine: string;
  itemCount: number;
  itemsPreview: string;
  items: DeliveryItem[];
  paymentMethod: "COD";
  subtotalVnd: number;
  deliveryFeeVnd: number;
  totalVnd: number;
  placedAt: string;
  driverAssigned: boolean;
  customerNote: string | null;
  rejectReason: string | null;
  delivery: { label: string; line: string; note: string | null };
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
  customerPhone: string | null;
};

export type DeliveryOverview = {
  current: Delivery | null;
  available: Delivery[];
  history: Delivery[];
};
