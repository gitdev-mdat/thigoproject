import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { DriverVehicleType } from "../../entities/driver/driver-profile.entity.js";
import { parseDriverPresence, parseDriverProfile } from "./driver.dto.js";

describe("driver input", () => {
  it("normalizes profile and vehicle data", () => {
    expect(
      parseDriverProfile({
        displayName: "  Nguyễn  An ",
        vehicleType: DriverVehicleType.MOTORBIKE,
        vehiclePlate: "59-a1 123.45"
      })
    ).toEqual({
      displayName: "Nguyễn An",
      vehicleType: DriverVehicleType.MOTORBIKE,
      vehiclePlate: "59-A1123.45"
    });
  });

  it("accepts a heartbeat without forcing a GPS write", () => {
    expect(parseDriverPresence({ online: true })).toEqual({
      online: true,
      location: null
    });
  });

  it("rejects impossible or incomplete GPS data", () => {
    expect(() =>
      parseDriverPresence({
        online: true,
        location: {
          latitude: 91,
          longitude: 106.7,
          accuracyMeters: 10,
          recordedAt: new Date().toISOString()
        }
      })
    ).toThrow(BadRequestException);
  });
});
