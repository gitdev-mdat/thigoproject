import { Module } from "@nestjs/common";
import { MediaController } from "../controllers/media/media.controller.js";
import { MerchantCatalogController } from "../controllers/merchant/merchant-catalog.controller.js";
import { MerchantMediaController } from "../controllers/merchant/merchant-media.controller.js";
import { MerchantStoreController } from "../controllers/merchant/merchant-store.controller.js";
import { RoleGuard } from "../guards/role.guard.js";
import { MediaFileStore } from "../repositories/media/media-file.store.js";
import { MediaRepository } from "../repositories/media/media.repository.js";
import { StorefrontRepository } from "../repositories/merchant/storefront.repository.js";
import { MediaService } from "../services/media/media.service.js";
import { MerchantCatalogService } from "../services/merchant/merchant-catalog.service.js";
import { StorefrontService } from "../services/merchant/storefront.service.js";
import { AuthModule } from "./auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [
    MerchantStoreController,
    MerchantCatalogController,
    MerchantMediaController,
    MediaController
  ],
  providers: [
    RoleGuard,
    StorefrontRepository,
    MediaRepository,
    MediaFileStore,
    MediaService,
    StorefrontService,
    MerchantCatalogService
  ]
})
export class MerchantModule {}
