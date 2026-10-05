import { Injectable } from "@nestjs/common";

import { DatabaseHealthRepository } from "../../repositories/health/database-health.repository.js";

export interface HealthStatus {
  api: "up";
  database: "up" | "down";
  status: "ok" | "degraded";
}

@Injectable()
export class HealthService {
  constructor(
    private readonly databaseHealthRepository: DatabaseHealthRepository
  ) {}

  async getHealth(): Promise<HealthStatus> {
    const database = await this.databaseHealthRepository.getStatus();
    return {
      api: "up",
      database,
      status: database === "up" ? "ok" : "degraded"
    };
  }
}
