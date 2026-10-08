import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation
} from "typeorm";
import { MenuCategory } from "./menu-category.entity.js";
export enum StoreCategory {
  FOOD = "FOOD",
  COFFEE = "COFFEE",
  MILK_TEA = "MILK_TEA"
}
@Entity("stores")
export class Store {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "owner_user_id", type: "uuid", unique: true })
  ownerUserId!: string;
  @Column({ type: "varchar", length: 80, unique: true }) slug!: string;
  @Column({ type: "varchar", length: 120 }) name!: string;
  @Column({ type: "text", nullable: true }) description!: string | null;
  @Column({ type: "enum", enum: StoreCategory, enumName: "store_category" })
  category!: StoreCategory;
  @Column({ name: "address_line", type: "varchar", length: 255 })
  addressLine!: string;
  @Column({
    name: "cover_image_url",
    type: "varchar",
    length: 500,
    nullable: true
  })
  coverImageUrl!: string | null;
  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
  @OneToMany(() => MenuCategory, (category) => category.store)
  categories!: Relation<MenuCategory>[];
}
