import type { Delivery } from "./delivery";

export type EtaSource = "ROUTING" | "ESTIMATED";

export type DeliveryOffer = {
  id: string;
  expiresAt: string;
  straightLineDistanceMeters: number;
  pickupEtaSeconds: number;
  etaSource: EtaSource;
  delivery: Delivery;
};

export type DriverEarnings = {
  todayVnd: number;
  weekVnd: number;
  completedToday: number;
  completedWeek: number;
  recent: {
    orderId: string;
    orderCode: string;
    storeName: string;
    amountVnd: number;
    earnedAt: string;
  }[];
};
