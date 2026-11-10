import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from "typeorm";
import { MerchantApplicationStatus } from "./merchant-application.entity.js";

/** Append-only history: one row per lifecycle step, never updated. */
@Entity("merchant_application_events")
export class MerchantApplicationEvent {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "application_id", type: "uuid" }) applicationId!: string;
  @Column({
    name: "from_status",
    type: "enum",
    enum: MerchantApplicationStatus,
    enumName: "merchant_application_status",
    nullable: true
  })
  fromStatus!: MerchantApplicationStatus | null;
  @Column({
    name: "to_status",
    type: "enum",
    enum: MerchantApplicationStatus,
    enumName: "merchant_application_status"
  })
  toStatus!: MerchantApplicationStatus;
  @Column({ type: "varchar", length: 32 }) action!: string;
  @Column({ name: "actor_user_id", type: "uuid" }) actorUserId!: string;
  @Column({ type: "varchar", length: 500, nullable: true }) note!:
    string | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
