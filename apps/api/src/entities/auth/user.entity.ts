import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { UserRole } from "./user-role.entity.js";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "phone", type: "varchar", length: 16, unique: true })
  phone!: string;
  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
  @OneToMany(() => UserRole, (role) => role.user) roles!: UserRole[];
}
