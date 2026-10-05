import { describe, expect, it, vi } from "vitest";

import { HealthService } from "../../services/health/health.service.js";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("delegates health reporting to the service", async () => {
    const healthService = {
      getHealth: vi.fn().mockResolvedValue({
        api: "up",
        database: "up",
        status: "ok"
      })
    } as unknown as HealthService;
    const controller = new HealthController(healthService);

    await expect(controller.getHealth()).resolves.toEqual({
      api: "up",
      database: "up",
      status: "ok"
    });
  });
});
