import { describe, expect, it } from "vitest";

import { EtaSource } from "../../entities/driver/delivery-offer.entity.js";
import { rankDispatchCandidates } from "./dispatch.service.js";

const pickup = { latitude: 10.78, longitude: 106.7 };

describe("rankDispatchCandidates", () => {
  it("ranks deterministically by ETA, fairness, then driver id", () => {
    const candidates = [
      {
        driverUserId: "b",
        latitude: 10.781,
        longitude: 106.7,
        headingDegrees: null,
        lastAssignedAt: new Date("2026-10-13T10:00:00Z")
      },
      {
        driverUserId: "a",
        latitude: 10.782,
        longitude: 106.7,
        headingDegrees: null,
        lastAssignedAt: null
      }
    ];
    const estimates = candidates.map((candidate) => ({
      driverUserId: candidate.driverUserId,
      straightLineDistanceMeters: 1,
      pickupEtaSeconds: 120,
      etaSource: EtaSource.ESTIMATED
    }));
    expect(
      rankDispatchCandidates(candidates, estimates, pickup).map(
        (item) => item.driverUserId
      )
    ).toEqual(["a", "b"]);
  });

  it("drops candidates beyond the configured radius", () => {
    const candidate = {
      driverUserId: "far",
      latitude: 11,
      longitude: 106.7,
      headingDegrees: null,
      lastAssignedAt: null
    };
    expect(
      rankDispatchCandidates(
        [candidate],
        [
          {
            driverUserId: "far",
            straightLineDistanceMeters: 1,
            pickupEtaSeconds: 1,
            etaSource: EtaSource.ESTIMATED
          }
        ],
        pickup
      )
    ).toEqual([]);
  });
});
