export type DriverVehicleType = "MOTORBIKE" | "BICYCLE" | "CAR";

export type DriverProfile = {
  userId: string;
  displayName: string;
  vehicleType: DriverVehicleType;
  vehiclePlate: string;
  lastAssignedAt: string | null;
};

export type DriverPresence = {
  userId: string;
  isOnline: boolean;
  lastHeartbeatAt: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracyMeters: number | null;
  headingDegrees: number | null;
  speedMetersPerSecond: number | null;
  locationRecordedAt: string | null;
};

export type DriverStatus = {
  profile: DriverProfile | null;
  presence: DriverPresence | null;
  activeDeliveryId: string | null;
  eligibleForOffers: boolean;
  freshness: {
    heartbeatFresh: boolean;
    locationFresh: boolean;
    accurate: boolean;
  };
};

export type DriverLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  headingDegrees: number | null;
  speedMetersPerSecond: number | null;
  recordedAt: string;
};
