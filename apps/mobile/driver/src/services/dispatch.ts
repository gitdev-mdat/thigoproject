import type { Delivery } from "../types/delivery";
import type { DeliveryOffer, DriverEarnings } from "../types/dispatch";
import { apiRequest } from "./api";

const offerPath = (id: string, action: "accept" | "reject") =>
  `/driver/offers/${encodeURIComponent(id)}/${action}`;

export const dispatchApi = {
  currentOffer: () =>
    apiRequest<DeliveryOffer | null>("/driver/offers/current"),
  accept: (id: string) =>
    apiRequest<Delivery>(offerPath(id, "accept"), { method: "POST" }),
  reject: (id: string) =>
    apiRequest<{ rejected: true }>(offerPath(id, "reject"), {
      method: "POST"
    }),
  earnings: () => apiRequest<DriverEarnings>("/driver/earnings")
};
