import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from "typeorm";
@Entity("customer_addresses")
@Unique("UQ_customer_addresses_user_label", ["userId", "label"])
export class CustomerAddress {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ type: "varchar", length: 40 }) label!: string;
  @Column({ type: "varchar", length: 255 }) line!: string;
  @Column({ type: "varchar", length: 255, nullable: true }) note!:
    string | null;
  @Column({ name: "is_default", type: "boolean", default: false })
  isDefault!: boolean;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
