import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  CurrentUser,
  RequireRole,
  RoleGuard,
  type AuthenticatedUser
} from "../../guards/role.guard.js";
import { DriverDeliveryService } from "../../services/ordering/driver-delivery.service.js";

@Controller("driver/deliveries")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.DRIVER)
export class DriverDeliveryController {
  constructor(private readonly deliveries: DriverDeliveryService) {}

  @Get() overview(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveries.overview(user.id);
  }

  @Post(":id/claim") @HttpCode(200) claim(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.deliveries.claim(user.id, id);
  }

  @Post(":id/pickup") @HttpCode(200) pickUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.deliveries.pickUp(user.id, id);
  }

  @Post(":id/deliver") @HttpCode(200) deliver(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.deliveries.deliver(user.id, id);
  }
}
