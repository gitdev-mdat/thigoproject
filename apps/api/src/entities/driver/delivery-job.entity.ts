import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

export enum DeliveryJobStatus {
  PENDING = "PENDING",
  OFFERING = "OFFERING",
  ASSIGNED = "ASSIGNED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXHAUSTED = "EXHAUSTED"
}

@Entity("delivery_jobs")
export class DeliveryJob {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "order_id", type: "uuid", unique: true }) orderId!: string;
  @Column({
    type: "enum",
    enum: DeliveryJobStatus,
    enumName: "delivery_job_status"
  })
  status!: DeliveryJobStatus;
  @Column({ type: "integer", default: 0 }) attempt!: number;
  @Column({ name: "next_dispatch_at", type: "timestamptz" })
  nextDispatchAt!: Date;
  @Column({ name: "assigned_driver_user_id", type: "uuid", nullable: true })
  assignedDriverUserId!: string | null;
  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
