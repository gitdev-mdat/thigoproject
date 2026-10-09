import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from "typeorm";
import type { MediaContentType } from "../media/media-asset.entity.js";

export enum ApplicationMediaKind {
  LOGO = "LOGO",
  COVER = "COVER",
  PHOTO = "PHOTO"
}

/** A private image attached to a partner application; never public. */
@Entity("merchant_application_media")
export class MerchantApplicationMedia {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "application_id", type: "uuid" }) applicationId!: string;
  @Column({
    type: "enum",
    enum: ApplicationMediaKind,
    enumName: "merchant_application_media_kind"
  })
  kind!: ApplicationMediaKind;
  @Column({ name: "uploaded_by_user_id", type: "uuid" })
  uploadedByUserId!: string;
  @Column({ name: "content_type", type: "varchar", length: 32 })
  contentType!: MediaContentType;
  @Column({ name: "byte_size", type: "integer" }) byteSize!: number;
  @Column({ type: "char", length: 64 }) sha256!: string;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
