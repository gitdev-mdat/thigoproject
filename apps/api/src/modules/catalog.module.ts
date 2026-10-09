import { Module } from "@nestjs/common";
import { CustomerCatalogController } from "../controllers/customer/customer-catalog.controller.js";
import { RoleGuard } from "../guards/role.guard.js";
import { CatalogRepository } from "../repositories/catalog/catalog.repository.js";
import { CustomerCatalogService } from "../services/catalog/customer-catalog.service.js";
import { AuthModule } from "./auth.module.js";
@Module({
  imports: [AuthModule],
  controllers: [CustomerCatalogController],
  providers: [CatalogRepository, CustomerCatalogService, RoleGuard],
  exports: [CatalogRepository, CustomerCatalogService]
})
export class CatalogModule {}
