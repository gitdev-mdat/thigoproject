import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation
} from "typeorm";
import { User } from "./user.entity.js";
export enum ApplicationRole {
  CUSTOMER = "CUSTOMER",
  MERCHANT = "MERCHANT",
  DRIVER = "DRIVER",
  ADMIN = "ADMIN"
}
@Entity("user_roles")
export class UserRole {
  @PrimaryColumn({ name: "user_id", type: "uuid" }) userId!: string;
  @PrimaryColumn({ type: "enum", enum: ApplicationRole })
  role!: ApplicationRole;
  @ManyToOne(() => User, (user) => user.roles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;
}
