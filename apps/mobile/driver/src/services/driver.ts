import type {
  DriverLocation,
  DriverProfile,
  DriverStatus
} from "../types/driver";
import { apiRequest } from "./api";

export const driverApi = {
  status: () => apiRequest<DriverStatus>("/driver/profile"),
  saveProfile: (
    profile: Pick<DriverProfile, "displayName" | "vehicleType" | "vehiclePlate">
  ) =>
    apiRequest<DriverStatus>("/driver/profile", {
      method: "POST",
      body: profile
    }),
  presence: (online: boolean, location?: DriverLocation) =>
    apiRequest<DriverStatus>("/driver/presence", {
      method: "POST",
      body: { online, ...(location ? { location } : {}) }
    })
};
