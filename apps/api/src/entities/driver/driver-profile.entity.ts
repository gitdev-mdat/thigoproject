import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn
} from "typeorm";

export enum DriverVehicleType {
  MOTORBIKE = "MOTORBIKE",
  BICYCLE = "BICYCLE",
  CAR = "CAR"
}

@Entity("driver_profiles")
export class DriverProfile {
  @PrimaryColumn({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ name: "display_name", type: "varchar", length: 100 })
  displayName!: string;
  @Column({
    name: "vehicle_type",
    type: "enum",
    enum: DriverVehicleType,
    enumName: "driver_vehicle_type"
  })
  vehicleType!: DriverVehicleType;
  @Column({ name: "vehicle_plate", type: "varchar", length: 20 })
  vehiclePlate!: string;
  @Column({ name: "last_assigned_at", type: "timestamptz", nullable: true })
  lastAssignedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
