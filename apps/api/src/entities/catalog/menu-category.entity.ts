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
import { Product } from "./product.entity.js";
import { Store } from "./store.entity.js";
@Entity("menu_categories")
@Unique("UQ_menu_categories_store_name", ["storeId", "name"])
export class MenuCategory {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "store_id", type: "uuid" }) storeId!: string;
  @Column({ type: "varchar", length: 80 }) name!: string;
  @Column({ type: "integer", default: 0 }) position!: number;
  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
  @ManyToOne(() => Store, (store) => store.categories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "store_id" })
  store!: Relation<Store>;
  @OneToMany(() => Product, (product) => product.category)
  products!: Relation<Product>[];
}
