import { Controller, Get } from "@nestjs/common";

import {
  HealthService,
  type HealthStatus
} from "../../services/health/health.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(): Promise<HealthStatus> {
    return this.healthService.getHealth();
  }
}
