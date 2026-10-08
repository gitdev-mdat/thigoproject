import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { createDatabaseOptions } from "../config/database.js";
import { readDatabaseEnvironment } from "../config/environment.js";
import { HealthController } from "../controllers/health/health.controller.js";
import { DatabaseHealthRepository } from "../repositories/health/database-health.repository.js";
import { HealthService } from "../services/health/health.service.js";
import { AuthModule } from "./auth.module.js";
import { CatalogModule } from "./catalog.module.js";
import { MerchantModule } from "./merchant.module.js";
import { OrderingModule } from "./ordering.module.js";

@Module({
  imports: [
    AuthModule,
    CatalogModule,
    OrderingModule,
    MerchantModule,
    TypeOrmModule.forRoot({
      ...createDatabaseOptions(readDatabaseEnvironment(process.env)),
      manualInitialization: true
    })
  ],
  controllers: [HealthController],
  providers: [DatabaseHealthRepository, HealthService]
})
export class AppModule {}
