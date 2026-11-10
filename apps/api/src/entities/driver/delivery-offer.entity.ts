import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from "typeorm";

export enum DeliveryOfferStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED"
}

export enum EtaSource {
  ROUTING = "ROUTING",
  ESTIMATED = "ESTIMATED"
}

@Entity("delivery_offers")
export class DeliveryOffer {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "job_id", type: "uuid" }) jobId!: string;
  @Column({ name: "driver_user_id", type: "uuid" }) driverUserId!: string;
  @Column({
    type: "enum",
    enum: DeliveryOfferStatus,
    enumName: "delivery_offer_status"
  })
  status!: DeliveryOfferStatus;
  @Column({ type: "integer" }) rank!: number;
  @Column({ name: "straight_line_distance_meters", type: "integer" })
  straightLineDistanceMeters!: number;
  @Column({ name: "pickup_eta_seconds", type: "integer" })
  pickupEtaSeconds!: number;
  @Column({
    name: "eta_source",
    type: "enum",
    enum: EtaSource,
    enumName: "delivery_eta_source"
  })
  etaSource!: EtaSource;
  @CreateDateColumn({ name: "offered_at", type: "timestamptz" })
  offeredAt!: Date;
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date;
  @Column({ name: "responded_at", type: "timestamptz", nullable: true })
  respondedAt!: Date | null;
}
