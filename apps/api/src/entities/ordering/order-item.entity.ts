import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation
} from "typeorm";
import { Order } from "./order.entity.js";

/** Option choices are copied onto the line so later menu edits never rewrite history. */
export interface OrderItemOption {
  groupName: string;
  name: string;
  priceDeltaVnd: number;
}

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "order_id", type: "uuid" }) orderId!: string;
  @Column({ name: "product_id", type: "uuid", nullable: true })
  productId!: string | null;
  @Column({ name: "product_name", type: "varchar", length: 120 })
  productName!: string;
  @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;
  @Column({ name: "unit_price_vnd", type: "integer" }) unitPriceVnd!: number;
  @Column({ type: "integer" }) quantity!: number;
  @Column({ name: "line_total_vnd", type: "integer" }) lineTotalVnd!: number;
  @Column({ type: "jsonb", default: () => "'[]'" })
  options!: OrderItemOption[];
  @Column({ type: "integer", default: 0 }) position!: number;
  @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Relation<Order>;
}
