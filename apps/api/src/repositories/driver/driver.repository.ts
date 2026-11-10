import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import type { DriverProfileInput } from "../../dto/driver/driver.dto.js";
import { DriverPresence } from "../../entities/driver/driver-presence.entity.js";
import { DriverProfile } from "../../entities/driver/driver-profile.entity.js";
import type { DriverLocationInput } from "../../dto/driver/driver.dto.js";

@Injectable()
export class DriverRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  findProfile(userId: string) {
    return this.db.getRepository(DriverProfile).findOneBy({ userId });
  }

  async saveProfile(userId: string, input: DriverProfileInput) {
    const repository = this.db.getRepository(DriverProfile);
    const current = await repository.findOneBy({ userId });
    return repository.save(
      repository.create({
        ...current,
        userId,
        ...input,
        lastAssignedAt: current?.lastAssignedAt ?? null
      })
    );
  }

  findPresence(userId: string) {
    return this.db.getRepository(DriverPresence).findOneBy({ userId });
  }

  async savePresence(
    userId: string,
    online: boolean,
    location: DriverLocationInput | null
  ): Promise<DriverPresence> {
    await this.db.query(
      `INSERT INTO driver_presence (
         user_id, is_online, last_heartbeat_at, latitude, longitude,
         location_accuracy_meters, heading_degrees, speed_meters_per_second,
         location_recorded_at, updated_at
       ) VALUES ($1, $2, now(), $3, $4, $5, $6, $7, $8, now())
       ON CONFLICT (user_id) DO UPDATE SET
         is_online = EXCLUDED.is_online,
         last_heartbeat_at = now(),
         latitude = CASE WHEN EXCLUDED.location_recorded_at IS NOT NULL
           AND (driver_presence.location_recorded_at IS NULL OR driver_presence.location_recorded_at < EXCLUDED.location_recorded_at)
           THEN EXCLUDED.latitude ELSE driver_presence.latitude END,
         longitude = CASE WHEN EXCLUDED.location_recorded_at IS NOT NULL
           AND (driver_presence.location_recorded_at IS NULL OR driver_presence.location_recorded_at < EXCLUDED.location_recorded_at)
           THEN EXCLUDED.longitude ELSE driver_presence.longitude END,
         location_accuracy_meters = CASE WHEN EXCLUDED.location_recorded_at IS NOT NULL
           AND (driver_presence.location_recorded_at IS NULL OR driver_presence.location_recorded_at < EXCLUDED.location_recorded_at)
           THEN EXCLUDED.location_accuracy_meters ELSE driver_presence.location_accuracy_meters END,
         heading_degrees = CASE WHEN EXCLUDED.location_recorded_at IS NOT NULL
           AND (driver_presence.location_recorded_at IS NULL OR driver_presence.location_recorded_at < EXCLUDED.location_recorded_at)
           THEN EXCLUDED.heading_degrees ELSE driver_presence.heading_degrees END,
         speed_meters_per_second = CASE WHEN EXCLUDED.location_recorded_at IS NOT NULL
           AND (driver_presence.location_recorded_at IS NULL OR driver_presence.location_recorded_at < EXCLUDED.location_recorded_at)
           THEN EXCLUDED.speed_meters_per_second ELSE driver_presence.speed_meters_per_second END,
         location_recorded_at = CASE WHEN EXCLUDED.location_recorded_at IS NOT NULL
           AND (driver_presence.location_recorded_at IS NULL OR driver_presence.location_recorded_at < EXCLUDED.location_recorded_at)
           THEN EXCLUDED.location_recorded_at ELSE driver_presence.location_recorded_at END,
         updated_at = now()`,
      [
        userId,
        online,
        location?.latitude ?? null,
        location?.longitude ?? null,
        location?.accuracyMeters ?? null,
        location?.headingDegrees ?? null,
        location?.speedMetersPerSecond ?? null,
        location?.recordedAt ?? null
      ]
    );
    return this.db.getRepository(DriverPresence).findOneByOrFail({ userId });
  }
}
