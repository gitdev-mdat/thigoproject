import type { Delivery, DeliveryOverview } from "../types/delivery";
import { apiRequest } from "./api";

const path = (id: string, action: string) =>
  `/driver/deliveries/${encodeURIComponent(id)}/${action}`;

export const deliveriesApi = {
  overview: () => apiRequest<DeliveryOverview>("/driver/deliveries"),
  claim: (id: string) =>
    apiRequest<Delivery>(path(id, "claim"), { method: "POST" }),
  pickup: (id: string) =>
    apiRequest<Delivery>(path(id, "pickup"), { method: "POST" }),
  deliver: (id: string) =>
    apiRequest<Delivery>(path(id, "deliver"), { method: "POST" })
};

export type DeliveryAction = Exclude<keyof typeof deliveriesApi, "overview">;
