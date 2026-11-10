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
import { DispatchService } from "../../services/driver/dispatch.service.js";

@Controller("driver")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.DRIVER)
export class DriverDispatchController {
  constructor(private readonly dispatch: DispatchService) {}

  @Get("offers/current") current(@CurrentUser() user: AuthenticatedUser) {
    return this.dispatch.currentOffer(user.id);
  }

  @Post("offers/:id/accept") @HttpCode(200) accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.dispatch.accept(user.id, id);
  }

  @Post("offers/:id/reject") @HttpCode(200) reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.dispatch.reject(user.id, id);
  }

  @Get("earnings") earnings(@CurrentUser() user: AuthenticatedUser) {
    return this.dispatch.earnings(user.id);
  }
}
