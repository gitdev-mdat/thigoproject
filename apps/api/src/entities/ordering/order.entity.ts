import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation
} from "typeorm";
import { Store } from "../catalog/store.entity.js";
import { OrderItem } from "./order-item.entity.js";

export enum OrderStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  PREPARING = "PREPARING",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  PICKED_UP = "PICKED_UP",
  DELIVERED = "DELIVERED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

export enum PaymentMethod {
  COD = "COD"
}

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 12, unique: true }) code!: string;
  @Column({ name: "customer_user_id", type: "uuid" }) customerUserId!: string;
  @Column({ name: "store_id", type: "uuid" }) storeId!: string;
  @Column({ name: "driver_user_id", type: "uuid", nullable: true })
  driverUserId!: string | null;
  @Column({ type: "enum", enum: OrderStatus, enumName: "order_status" })
  status!: OrderStatus;
  @Column({
    name: "payment_method",
    type: "enum",
    enum: PaymentMethod,
    enumName: "payment_method"
  })
  paymentMethod!: PaymentMethod;
  @Column({ name: "subtotal_vnd", type: "integer" }) subtotalVnd!: number;
  @Column({ name: "delivery_fee_vnd", type: "integer" })
  deliveryFeeVnd!: number;
  @Column({ name: "total_vnd", type: "integer" }) totalVnd!: number;
  @Column({ name: "customer_phone", type: "varchar", length: 16 })
  customerPhone!: string;
  @Column({ name: "delivery_label", type: "varchar", length: 40 })
  deliveryLabel!: string;
  @Column({ name: "delivery_line", type: "varchar", length: 255 })
  deliveryLine!: string;
  @Column({
    name: "delivery_note",
    type: "varchar",
    length: 255,
    nullable: true
  })
  deliveryNote!: string | null;
  @Column({
    name: "customer_note",
    type: "varchar",
    length: 500,
    nullable: true
  })
  customerNote!: string | null;
  @Column({ name: "idempotency_key", type: "varchar", length: 64 })
  idempotencyKey!: string;
  @Column({
    name: "reject_reason",
    type: "varchar",
    length: 255,
    nullable: true
  })
  rejectReason!: string | null;
  @Column({ name: "placed_at", type: "timestamptz" }) placedAt!: Date;
  @Column({ name: "accepted_at", type: "timestamptz", nullable: true })
  acceptedAt!: Date | null;
  @Column({ name: "preparing_at", type: "timestamptz", nullable: true })
  preparingAt!: Date | null;
  @Column({ name: "ready_at", type: "timestamptz", nullable: true })
  readyAt!: Date | null;
  @Column({ name: "assigned_at", type: "timestamptz", nullable: true })
  assignedAt!: Date | null;
  @Column({ name: "picked_up_at", type: "timestamptz", nullable: true })
  pickedUpAt!: Date | null;
  @Column({ name: "delivered_at", type: "timestamptz", nullable: true })
  deliveredAt!: Date | null;
  @Column({ name: "closed_at", type: "timestamptz", nullable: true })
  closedAt!: Date | null;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
  @ManyToOne(() => Store, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "store_id" })
  store!: Relation<Store>;
  @OneToMany(() => OrderItem, (item) => item.order)
  items!: Relation<OrderItem>[];
}
