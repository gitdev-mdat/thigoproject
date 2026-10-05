import { describe, expect, it, vi } from "vitest";

import type { DatabaseHealthRepository } from "../../repositories/health/database-health.repository.js";
import { HealthService } from "./health.service.js";

describe("HealthService", () => {
  it.each([
    ["up", "ok"],
    ["down", "degraded"]
  ] as const)("maps database %s to API status %s", async (database, status) => {
    const repository = {
      getStatus: vi.fn().mockResolvedValue(database)
    } as unknown as DatabaseHealthRepository;
    const service = new HealthService(repository);

    await expect(service.getHealth()).resolves.toEqual({
      api: "up",
      database,
      status
    });
  });
});
