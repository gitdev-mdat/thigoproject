import { Module } from "@nestjs/common";
import { AuthController } from "../controllers/auth/auth.controller.js";
import { AuthRepository } from "../repositories/auth/auth.repository.js";
import { AuthService } from "../services/auth/auth.service.js";
@Module({
  controllers: [AuthController],
  providers: [AuthRepository, AuthService]
})
export class AuthModule {}
