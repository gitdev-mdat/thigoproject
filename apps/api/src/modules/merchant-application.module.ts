import { Module } from "@nestjs/common";
import { MerchantApplicationController } from "../controllers/merchant/merchant-application.controller.js";
import { SessionGuard } from "../guards/session.guard.js";
import { MediaFileStore } from "../repositories/media/media-file.store.js";
import { ApplicationMediaRepository } from "../repositories/merchant/application-media.repository.js";
import { MerchantApplicationRepository } from "../repositories/merchant/merchant-application.repository.js";
import { ApplicationMediaService } from "../services/merchant/application-media.service.js";
import { MerchantApplicationService } from "../services/merchant/merchant-application.service.js";
import { AuthModule } from "./auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [MerchantApplicationController],
  providers: [
    SessionGuard,
    MediaFileStore,
    MerchantApplicationRepository,
    ApplicationMediaRepository,
    ApplicationMediaService,
    MerchantApplicationService
  ],
  exports: [MerchantApplicationService, ApplicationMediaService]
})
export class MerchantApplicationModule {}
