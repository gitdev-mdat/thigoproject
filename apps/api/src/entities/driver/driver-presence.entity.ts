import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("driver_presence")
export class DriverPresence {
  @PrimaryColumn({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ name: "is_online", type: "boolean", default: false })
  isOnline!: boolean;
  @Column({ name: "last_heartbeat_at", type: "timestamptz", nullable: true })
  lastHeartbeatAt!: Date | null;
  @Column({ type: "double precision", nullable: true }) latitude!:
    number | null;
  @Column({ type: "double precision", nullable: true }) longitude!:
    number | null;
  @Column({
    name: "location_accuracy_meters",
    type: "real",
    nullable: true
  })
  locationAccuracyMeters!: number | null;
  @Column({ name: "heading_degrees", type: "real", nullable: true })
  headingDegrees!: number | null;
  @Column({ name: "speed_meters_per_second", type: "real", nullable: true })
  speedMetersPerSecond!: number | null;
  @Column({ name: "location_recorded_at", type: "timestamptz", nullable: true })
  locationRecordedAt!: Date | null;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
