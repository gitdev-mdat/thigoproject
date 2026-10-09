import { Module } from "@nestjs/common";
import { AdminController } from "../controllers/admin/admin.controller.js";
import { RoleGuard } from "../guards/role.guard.js";
import { AdminRepository } from "../repositories/admin/admin.repository.js";
import { AdminService } from "../services/admin/admin.service.js";
import { AuthModule } from "./auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [RoleGuard, AdminRepository, AdminService]
})
export class AdminModule {}
