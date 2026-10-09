import { Module } from "@nestjs/common";
import { MerchantApplicationController } from "../controllers/merchant/merchant-application.controller.js";
import { SessionGuard } from "../guards/session.guard.js";
import { MerchantApplicationRepository } from "../repositories/merchant/merchant-application.repository.js";
import { MerchantApplicationService } from "../services/merchant/merchant-application.service.js";
import { AuthModule } from "./auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [MerchantApplicationController],
  providers: [
    SessionGuard,
    MerchantApplicationRepository,
    MerchantApplicationService
  ],
  exports: [MerchantApplicationService]
})
export class MerchantApplicationModule {}
