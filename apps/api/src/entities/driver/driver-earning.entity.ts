import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity("driver_earnings")
export class DriverEarning {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "order_id", type: "uuid", unique: true }) orderId!: string;
  @Column({ name: "driver_user_id", type: "uuid" }) driverUserId!: string;
  /** MVP policy: the order's persisted delivery fee is the gross driver earning. */
  @Column({ name: "amount_vnd", type: "integer" }) amountVnd!: number;
  @Column({ type: "varchar", length: 40, default: "DELIVERY_FEE" })
  source!: string;
  @CreateDateColumn({ name: "earned_at", type: "timestamptz" })
  earnedAt!: Date;
}
