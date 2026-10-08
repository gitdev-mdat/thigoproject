import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  type Relation
} from "typeorm";
import { MenuCategory } from "./menu-category.entity.js";
import { ProductOptionGroup } from "./product-option-group.entity.js";
import { Store } from "./store.entity.js";
@Entity("products")
@Unique("UQ_products_store_name", ["storeId", "name"])
export class Product {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "store_id", type: "uuid" }) storeId!: string;
  @Column({ name: "category_id", type: "uuid" }) categoryId!: string;
  @Column({ type: "varchar", length: 120 }) name!: string;
  @Column({ type: "text", nullable: true }) description!: string | null;
  /** Whole Vietnamese đồng; money is never stored as a float. */
  @Column({ name: "price_vnd", type: "integer" }) priceVnd!: number;
  @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;
  @Column({ name: "is_available", type: "boolean", default: true })
  isAvailable!: boolean;
  @Column({ type: "integer", default: 0 }) position!: number;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
  @ManyToOne(() => Store, { onDelete: "CASCADE" })
  @JoinColumn({ name: "store_id" })
  store!: Relation<Store>;
  @ManyToOne(() => MenuCategory, (category) => category.products, {
    onDelete: "RESTRICT"
  })
  @JoinColumn({ name: "category_id" })
  category!: Relation<MenuCategory>;
  @OneToMany(() => ProductOptionGroup, (group) => group.product)
  optionGroups!: Relation<ProductOptionGroup>[];
}
