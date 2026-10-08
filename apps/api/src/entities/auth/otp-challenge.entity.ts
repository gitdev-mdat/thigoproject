import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from "typeorm";
@Entity("otp_challenges")
@Index(["phone", "createdAt"])
export class OtpChallenge {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 16 }) phone!: string;
  @Column({ name: "otp_hash", type: "varchar", length: 128 }) otpHash!: string;
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date;
  @Column({ name: "attempt_count", type: "integer", default: 0 })
  attemptCount!: number;
  @Column({ name: "attempt_limit", type: "integer" }) attemptLimit!: number;
  @Column({ name: "resend_after", type: "timestamptz" }) resendAfter!: Date;
  @Column({ name: "consumed_at", type: "timestamptz", nullable: true })
  consumedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
