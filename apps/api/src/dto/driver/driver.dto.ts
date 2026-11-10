import { BadRequestException } from "@nestjs/common";

import { DriverVehicleType } from "../../entities/driver/driver-profile.entity.js";

function invalid(message = "Dữ liệu gửi lên không hợp lệ."): never {
  throw new BadRequestException(message);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function requiredText(
  value: unknown,
  min: number,
  max: number,
  label: string
): string {
  if (typeof value !== "string") invalid(`${label} không hợp lệ.`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < min || normalized.length > max)
    invalid(`${label} cần từ ${min} đến ${max} ký tự.`);
  return normalized;
}

export interface DriverProfileInput {
  displayName: string;
  vehicleType: DriverVehicleType;
  vehiclePlate: string;
}

export function parseDriverProfile(body: unknown): DriverProfileInput {
  const value = record(body);
  const vehicleType = Object.values(DriverVehicleType).find(
    (item) => item === value.vehicleType
  );
  if (!vehicleType) invalid("Loại phương tiện không hợp lệ.");
  return {
    displayName: requiredText(value.displayName, 2, 100, "Tên tài xế"),
    vehicleType,
    vehiclePlate: requiredText(value.vehiclePlate, 4, 20, "Biển số xe")
      .toUpperCase()
      .replace(/\s+/g, "")
  };
}

export interface DriverLocationInput {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  headingDegrees: number | null;
  speedMetersPerSecond: number | null;
  recordedAt: Date;
}

export interface DriverPresenceInput {
  online: boolean;
  location: DriverLocationInput | null;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    invalid(`${label} không hợp lệ.`);
  return value;
}

function optionalFinite(value: unknown, label: string): number | null {
  if (value === undefined || value === null) return null;
  return finite(value, label);
}

function parseLocation(value: unknown): DriverLocationInput {
  const location = record(value);
  const latitude = finite(location.latitude, "Vĩ độ");
  const longitude = finite(location.longitude, "Kinh độ");
  const accuracyMeters = finite(location.accuracyMeters, "Độ chính xác GPS");
  const headingDegrees = optionalFinite(
    location.headingDegrees,
    "Hướng di chuyển"
  );
  const speedMetersPerSecond = optionalFinite(
    location.speedMetersPerSecond,
    "Tốc độ"
  );
  if (latitude < -90 || latitude > 90) invalid("Vĩ độ không hợp lệ.");
  if (longitude < -180 || longitude > 180) invalid("Kinh độ không hợp lệ.");
  if (accuracyMeters <= 0 || accuracyMeters > 2_000)
    invalid("Độ chính xác GPS không hợp lệ.");
  if (headingDegrees !== null && (headingDegrees < 0 || headingDegrees > 360))
    invalid("Hướng di chuyển không hợp lệ.");
  if (
    speedMetersPerSecond !== null &&
    (speedMetersPerSecond < 0 || speedMetersPerSecond > 100)
  )
    invalid("Tốc độ không hợp lệ.");
  if (typeof location.recordedAt !== "string")
    invalid("Thời điểm GPS không hợp lệ.");
  const recordedAt = new Date(location.recordedAt);
  if (Number.isNaN(recordedAt.getTime()))
    invalid("Thời điểm GPS không hợp lệ.");
  return {
    latitude,
    longitude,
    accuracyMeters,
    headingDegrees,
    speedMetersPerSecond,
    recordedAt
  };
}

export function parseDriverPresence(body: unknown): DriverPresenceInput {
  const value = record(body);
  if (typeof value.online !== "boolean")
    invalid("Trạng thái hoạt động không hợp lệ.");
  return {
    online: value.online,
    location:
      value.location === undefined || value.location === null
        ? null
        : parseLocation(value.location)
  };
}
