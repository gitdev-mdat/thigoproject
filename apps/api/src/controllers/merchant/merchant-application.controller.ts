import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  UseGuards
} from "@nestjs/common";
import { parseApplicationInput } from "../../dto/merchant/application.dto.js";
import {
  CurrentUser,
  type AuthenticatedUser
} from "../../guards/role.guard.js";
import { SessionGuard } from "../../guards/session.guard.js";
import { MerchantApplicationService } from "../../services/merchant/merchant-application.service.js";

/**
 * The signed-in user's own partner application. Any verified phone may use
 * it; nothing here grants a role except activating an Admin approval.
 */
@Controller("merchant-applications/me")
@UseGuards(SessionGuard)
export class MerchantApplicationController {
  constructor(private readonly applications: MerchantApplicationService) {}

  @Get() mine(@CurrentUser() user: AuthenticatedUser) {
    return this.applications.mine(user);
  }

  @Put() save(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.applications.save(user, parseApplicationInput(body));
  }

  @Post("submit") @HttpCode(200) submit(
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.applications.submit(user);
  }

  @Post("activate") @HttpCode(200) activate(
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.applications.activate(user);
  }
}
