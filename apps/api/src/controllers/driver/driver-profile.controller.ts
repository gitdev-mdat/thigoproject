import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards
} from "@nestjs/common";

import {
  parseDriverPresence,
  parseDriverProfile
} from "../../dto/driver/driver.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  CurrentUser,
  RequireRole,
  RoleGuard,
  type AuthenticatedUser
} from "../../guards/role.guard.js";
import { DriverProfileService } from "../../services/driver/driver-profile.service.js";

@Controller("driver")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.DRIVER)
export class DriverProfileController {
  constructor(private readonly drivers: DriverProfileService) {}

  @Get("profile") profile(@CurrentUser() user: AuthenticatedUser) {
    return this.drivers.status(user.id);
  }

  @Post("profile") @HttpCode(200) saveProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.drivers.saveProfile(user.id, parseDriverProfile(body));
  }

  @Post("presence") @HttpCode(200) savePresence(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.drivers.savePresence(user.id, parseDriverPresence(body));
  }
}
