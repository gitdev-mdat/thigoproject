import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  type Relation
} from "typeorm";
import { Product } from "./product.entity.js";
import { ProductOption } from "./product-option.entity.js";
@Entity("product_option_groups")
@Unique("UQ_product_option_groups_product_name", ["productId", "name"])
export class ProductOptionGroup {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "product_id", type: "uuid" }) productId!: string;
  @Column({ type: "varchar", length: 80 }) name!: string;
  @Column({ name: "min_select", type: "integer", default: 0 })
  minSelect!: number;
  @Column({ name: "max_select", type: "integer", default: 1 })
  maxSelect!: number;
  @Column({ type: "integer", default: 0 }) position!: number;
  @ManyToOne(() => Product, (product) => product.optionGroups, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "product_id" })
  product!: Relation<Product>;
  @OneToMany(() => ProductOption, (option) => option.group)
  options!: Relation<ProductOption>[];
}
