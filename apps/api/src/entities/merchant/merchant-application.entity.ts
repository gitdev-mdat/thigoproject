import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { StoreCategory } from "../catalog/store.entity.js";

export enum MerchantApplicationStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export enum MerchantApplicationSource {
  SELF = "SELF",
  ADMIN = "ADMIN"
}

@Entity("merchant_applications")
export class MerchantApplication {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 12, unique: true }) code!: string;
  /** The account phone that will hold the MERCHANT role (+84…). */
  @Column({ type: "varchar", length: 16 }) phone!: string;
  /** Null while an Admin invitation waits for that phone's first sign-in. */
  @Column({ name: "applicant_user_id", type: "uuid", nullable: true })
  applicantUserId!: string | null;
  @Column({
    type: "enum",
    enum: MerchantApplicationSource,
    enumName: "merchant_application_source"
  })
  source!: MerchantApplicationSource;
  @Column({
    type: "enum",
    enum: MerchantApplicationStatus,
    enumName: "merchant_application_status"
  })
  status!: MerchantApplicationStatus;
  @Column({ name: "store_name", type: "varchar", length: 120 })
  storeName!: string;
  @Column({ type: "enum", enum: StoreCategory, enumName: "store_category" })
  category!: StoreCategory;
  @Column({ name: "contact_phone", type: "varchar", length: 20 })
  contactPhone!: string;
  @Column({ name: "address_line", type: "varchar", length: 255 })
  addressLine!: string;
  @Column({ type: "text", nullable: true }) description!: string | null;
  @Column({ name: "contact_name", type: "varchar", length: 80 })
  contactName!: string;
  /** The latest reason for changes or rejection, shown to the applicant. */
  @Column({ name: "review_note", type: "varchar", length: 500, nullable: true })
  reviewNote!: string | null;
  @Column({ name: "submitted_at", type: "timestamptz", nullable: true })
  submittedAt!: Date | null;
  @Column({ name: "decided_at", type: "timestamptz", nullable: true })
  decidedAt!: Date | null;
  @Column({ name: "decided_by_user_id", type: "uuid", nullable: true })
  decidedByUserId!: string | null;
  /** Set together with storeId when the role and store have been granted. */
  @Column({ name: "activated_at", type: "timestamptz", nullable: true })
  activatedAt!: Date | null;
  @Column({ name: "store_id", type: "uuid", nullable: true, unique: true })
  storeId!: string | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
