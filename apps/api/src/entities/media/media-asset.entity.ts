import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from "typeorm";

export type MediaContentType = "image/jpeg" | "image/png" | "image/webp";

/** An uploaded image; the bytes live in media storage under this id. */
@Entity("media_assets")
export class MediaAsset {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "store_id", type: "uuid" }) storeId!: string;
  @Column({ name: "uploaded_by_user_id", type: "uuid" })
  uploadedByUserId!: string;
  @Column({ name: "content_type", type: "varchar", length: 32 })
  contentType!: MediaContentType;
  @Column({ name: "byte_size", type: "integer" }) byteSize!: number;
  @Column({ type: "char", length: 64 }) sha256!: string;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
