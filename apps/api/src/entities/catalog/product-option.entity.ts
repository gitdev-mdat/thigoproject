import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation
} from "typeorm";
import { ProductOptionGroup } from "./product-option-group.entity.js";
@Entity("product_options")
@Unique("UQ_product_options_group_name", ["groupId", "name"])
export class ProductOption {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "group_id", type: "uuid" }) groupId!: string;
  @Column({ type: "varchar", length: 80 }) name!: string;
  @Column({ name: "price_delta_vnd", type: "integer", default: 0 })
  priceDeltaVnd!: number;
  @Column({ name: "is_available", type: "boolean", default: true })
  isAvailable!: boolean;
  @Column({ type: "integer", default: 0 }) position!: number;
  @ManyToOne(() => ProductOptionGroup, (group) => group.options, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "group_id" })
  group!: Relation<ProductOptionGroup>;
}
