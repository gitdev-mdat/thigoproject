import { Module } from "@nestjs/common";

import { DriverDeliveryController } from "../controllers/driver/driver-delivery.controller.js";
import { DriverDispatchController } from "../controllers/driver/driver-dispatch.controller.js";
import { DriverProfileController } from "../controllers/driver/driver-profile.controller.js";
import { RoleGuard } from "../guards/role.guard.js";
import { DispatchRepository } from "../repositories/driver/dispatch.repository.js";
import { DriverRepository } from "../repositories/driver/driver.repository.js";
import { OrderRepository } from "../repositories/ordering/order.repository.js";
import { DispatchService } from "../services/driver/dispatch.service.js";
import { DriverProfileService } from "../services/driver/driver-profile.service.js";
import { RoutingService } from "../services/driver/routing.service.js";
import { DriverDeliveryService } from "../services/ordering/driver-delivery.service.js";
import { AuthModule } from "./auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [
    DriverDeliveryController,
    DriverDispatchController,
    DriverProfileController
  ],
  providers: [
    RoleGuard,
    DispatchRepository,
    DriverRepository,
    OrderRepository,
    DispatchService,
    DriverProfileService,
    RoutingService,
    DriverDeliveryService
  ]
})
export class DriverModule {}
