import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { createDatabaseOptions } from "../config/database.js";
import { readDatabaseEnvironment } from "../config/environment.js";
import { HealthController } from "../controllers/health/health.controller.js";
import { DatabaseHealthRepository } from "../repositories/health/database-health.repository.js";
import { HealthService } from "../services/health/health.service.js";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...createDatabaseOptions(readDatabaseEnvironment(process.env)),
      manualInitialization: true
    })
  ],
  controllers: [HealthController],
  providers: [DatabaseHealthRepository, HealthService]
})
export class AppModule {}
