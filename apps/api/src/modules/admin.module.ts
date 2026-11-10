import { Module } from "@nestjs/common";
import { AdminController } from "../controllers/admin/admin.controller.js";
import { RoleGuard } from "../guards/role.guard.js";
import { AdminRepository } from "../repositories/admin/admin.repository.js";
import { AdminService } from "../services/admin/admin.service.js";
import { AuthModule } from "./auth.module.js";
import { CatalogModule } from "./catalog.module.js";
import { MerchantApplicationModule } from "./merchant-application.module.js";

@Module({
  imports: [AuthModule, CatalogModule, MerchantApplicationModule],
  controllers: [AdminController],
  providers: [RoleGuard, AdminRepository, AdminService]
})
export class AdminModule {}
