import { afterEach, describe, expect, it, vi } from "vitest";

import { EtaSource } from "../../entities/driver/delivery-offer.entity.js";
import { RoutingService } from "./routing.service.js";

const drivers = [
  {
    driverUserId: "a",
    latitude: 10.7769,
    longitude: 106.7009,
    headingDegrees: 90
  }
];
const pickup = { latitude: 10.7869, longitude: 106.7009 };

describe("RoutingService", () => {
  afterEach(() => {
    delete process.env.ROUTING_BASE_URL;
    vi.unstubAllGlobals();
  });

  it("labels its no-provider calculation as an estimate", async () => {
    const [result] = await new RoutingService().pickupEtas(drivers, pickup);
    expect(result?.etaSource).toBe(EtaSource.ESTIMATED);
    expect(result?.straightLineDistanceMeters).toBeGreaterThan(1_100);
    expect(result?.pickupEtaSeconds).toBeGreaterThan(0);
  });

  it("uses one routing matrix response when configured", async () => {
    process.env.ROUTING_BASE_URL = "http://router.test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "Ok", durations: [[321.2]] }), {
          status: 200
        })
      )
    );
    const [result] = await new RoutingService().pickupEtas(drivers, pickup);
    expect(fetch).toHaveBeenCalledOnce();
    expect(result?.etaSource).toBe(EtaSource.ROUTING);
    expect(result?.pickupEtaSeconds).toBe(322);
  });
});
