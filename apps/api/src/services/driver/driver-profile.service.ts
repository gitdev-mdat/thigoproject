import { Injectable } from "@nestjs/common";

import { haversineMeters } from "../../common/location/geo.js";
import type {
  DriverLocationInput,
  DriverPresenceInput,
  DriverProfileInput
} from "../../dto/driver/driver.dto.js";
import type { DriverPresence } from "../../entities/driver/driver-presence.entity.js";
import {
  DRIVER_ACTIVE_STATUSES,
  OrderRepository
} from "../../repositories/ordering/order.repository.js";
import { DriverRepository } from "../../repositories/driver/driver.repository.js";

export const DRIVER_HEARTBEAT_FRESH_MS = 45_000;
export const DRIVER_LOCATION_FRESH_MS = 120_000;
export const DRIVER_MAX_ACCURACY_METERS = 100;
export const DRIVER_MIN_LOCATION_WRITE_MS = 20_000;
export const DRIVER_MIN_LOCATION_MOVE_METERS = 25;
const LOCATION_MAX_AGE_MS = 5 * 60_000;
const LOCATION_MAX_FUTURE_MS = 30_000;

export function acceptableLocationTime(recordedAt: Date, now: Date): boolean {
  const age = now.getTime() - recordedAt.getTime();
  return age >= -LOCATION_MAX_FUTURE_MS && age <= LOCATION_MAX_AGE_MS;
}

export function shouldPersistLocation(
  previous: DriverPresence | null,
  next: DriverLocationInput
): boolean {
  if (
    !previous?.locationRecordedAt ||
    previous.latitude === null ||
    previous.longitude === null
  )
    return true;
  if (next.recordedAt <= previous.locationRecordedAt) return false;
  const elapsed =
    next.recordedAt.getTime() - previous.locationRecordedAt.getTime();
  if (elapsed >= DRIVER_MIN_LOCATION_WRITE_MS) return true;
  return (
    haversineMeters(
      { latitude: previous.latitude, longitude: previous.longitude },
      next
    ) >= DRIVER_MIN_LOCATION_MOVE_METERS ||
    (previous.locationAccuracyMeters !== null &&
      next.accuracyMeters + 20 < previous.locationAccuracyMeters)
  );
}

export function presenceEligibility(
  presence: DriverPresence | null,
  now: Date
): { heartbeatFresh: boolean; locationFresh: boolean; accurate: boolean } {
  const heartbeatFresh = Boolean(
    presence?.isOnline &&
    presence.lastHeartbeatAt &&
    now.getTime() - presence.lastHeartbeatAt.getTime() <=
      DRIVER_HEARTBEAT_FRESH_MS
  );
  const locationFresh = Boolean(
    presence?.locationRecordedAt &&
    now.getTime() - presence.locationRecordedAt.getTime() <=
      DRIVER_LOCATION_FRESH_MS
  );
  const accurate = Boolean(
    presence?.locationAccuracyMeters &&
    presence.locationAccuracyMeters <= DRIVER_MAX_ACCURACY_METERS
  );
  return { heartbeatFresh, locationFresh, accurate };
}

@Injectable()
export class DriverProfileService {
  constructor(
    private readonly drivers: DriverRepository,
    private readonly orders: OrderRepository
  ) {}

  async status(userId: string) {
    const [profile, presence, active] = await Promise.all([
      this.drivers.findProfile(userId),
      this.drivers.findPresence(userId),
      this.orders.listForDriver(userId, DRIVER_ACTIVE_STATUSES, 1)
    ]);
    const freshness = presenceEligibility(presence, new Date());
    return {
      profile,
      presence,
      activeDeliveryId: active[0]?.id ?? null,
      eligibleForOffers:
        Boolean(profile) &&
        !active[0] &&
        freshness.heartbeatFresh &&
        freshness.locationFresh &&
        freshness.accurate,
      freshness
    };
  }

  async saveProfile(userId: string, input: DriverProfileInput) {
    await this.drivers.saveProfile(userId, input);
    return this.status(userId);
  }

  async savePresence(userId: string, input: DriverPresenceInput) {
    const now = new Date();
    const previous = await this.drivers.findPresence(userId);
    const location =
      input.location &&
      acceptableLocationTime(input.location.recordedAt, now) &&
      shouldPersistLocation(previous, input.location)
        ? input.location
        : null;
    await this.drivers.savePresence(userId, input.online, location);
    return this.status(userId);
  }
}
