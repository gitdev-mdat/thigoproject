import { Injectable } from "@nestjs/common";

import {
  haversineMeters,
  type Coordinates
} from "../../common/location/geo.js";
import { EtaSource } from "../../entities/driver/delivery-offer.entity.js";

export interface DriverRoutePoint extends Coordinates {
  driverUserId: string;
  headingDegrees: number | null;
}

export interface PickupEta {
  driverUserId: string;
  straightLineDistanceMeters: number;
  pickupEtaSeconds: number;
  etaSource: EtaSource;
}

const FALLBACK_ROAD_FACTOR = 1.35;
const FALLBACK_SPEED_METERS_PER_SECOND = 25_000 / 3_600;
const ROUTING_TIMEOUT_MS = 1_500;

/**
 * One bounded matrix request when OSRM-compatible routing is configured;
 * otherwise returns an explicitly labelled estimate from the Haversine prefilter.
 */
@Injectable()
export class RoutingService {
  async pickupEtas(
    drivers: DriverRoutePoint[],
    pickup: Coordinates
  ): Promise<PickupEta[]> {
    if (!drivers.length) return [];
    const routed = process.env.ROUTING_BASE_URL
      ? await this.osrm(drivers, pickup).catch(() => null)
      : null;
    if (routed) return routed;
    return drivers.map((driver) => {
      const distance = haversineMeters(driver, pickup);
      return {
        driverUserId: driver.driverUserId,
        straightLineDistanceMeters: Math.round(distance),
        pickupEtaSeconds: Math.max(
          60,
          Math.ceil(
            (distance * FALLBACK_ROAD_FACTOR) / FALLBACK_SPEED_METERS_PER_SECOND
          )
        ),
        etaSource: EtaSource.ESTIMATED
      };
    });
  }

  private async osrm(
    drivers: DriverRoutePoint[],
    pickup: Coordinates
  ): Promise<PickupEta[] | null> {
    const base = process.env.ROUTING_BASE_URL!.replace(/\/$/, "");
    const points = [...drivers, pickup];
    const coordinates = points
      .map((point) => `${point.longitude},${point.latitude}`)
      .join(";");
    const sources = drivers.map((_, index) => index).join(";");
    const destination = drivers.length;
    const bearings = [
      ...drivers.map((driver) =>
        driver.headingDegrees === null
          ? ""
          : `${Math.round(driver.headingDegrees)},45`
      ),
      ""
    ].join(";");
    const url = new URL(`${base}/table/v1/driving/${coordinates}`);
    url.searchParams.set("sources", sources);
    url.searchParams.set("destinations", String(destination));
    url.searchParams.set("annotations", "duration");
    if (drivers.some((driver) => driver.headingDegrees !== null))
      url.searchParams.set("bearings", bearings);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(ROUTING_TIMEOUT_MS)
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      code?: string;
      durations?: (number | null)[][];
    };
    if (body.code !== "Ok" || body.durations?.length !== drivers.length)
      return null;
    const estimates = drivers.map((driver, index) => {
      const duration = body.durations?.[index]?.[0];
      if (typeof duration !== "number" || !Number.isFinite(duration))
        return null;
      return {
        driverUserId: driver.driverUserId,
        straightLineDistanceMeters: Math.round(haversineMeters(driver, pickup)),
        pickupEtaSeconds: Math.max(1, Math.ceil(duration)),
        etaSource: EtaSource.ROUTING
      } satisfies PickupEta;
    });
    return estimates.every((item) => item !== null)
      ? (estimates as PickupEta[])
      : null;
  }
}
