import type { DeliveryDto } from "../ordering/ordering.dto.js";
import type { EtaSource } from "../../entities/driver/delivery-offer.entity.js";

export interface DeliveryOfferDto {
  id: string;
  expiresAt: string;
  straightLineDistanceMeters: number;
  pickupEtaSeconds: number;
  etaSource: EtaSource;
  delivery: DeliveryDto;
}

export interface DriverEarningsDto {
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
}
