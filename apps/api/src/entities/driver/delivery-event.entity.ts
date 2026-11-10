import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity("delivery_events")
export class DeliveryEvent {
  @PrimaryGeneratedColumn("increment", { type: "bigint" }) id!: string;
  @Column({ name: "job_id", type: "uuid", nullable: true })
  jobId!: string | null;
  @Column({ name: "order_id", type: "uuid" }) orderId!: string;
  @Column({ name: "driver_user_id", type: "uuid", nullable: true })
  driverUserId!: string | null;
  @Column({ type: "varchar", length: 50 }) type!: string;
  @Column({ type: "jsonb", default: () => "'{}'" })
  details!: Record<string, unknown>;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
