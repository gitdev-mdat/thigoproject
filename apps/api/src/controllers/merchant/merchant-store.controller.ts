import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Put,
  UseGuards
} from "@nestjs/common";
import {
  parseAcceptingOrders,
  parseOpeningHours,
  parsePublished,
  parseStoreProfile,
  parseStoreUpdate
} from "../../dto/merchant/storefront.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  CurrentUser,
  RequireRole,
  RoleGuard,
  type AuthenticatedUser
} from "../../guards/role.guard.js";
import { StorefrontService } from "../../services/merchant/storefront.service.js";

@Controller("merchant/store")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.MERCHANT)
export class MerchantStoreController {
  constructor(private readonly stores: StorefrontService) {}

  @Get() overview(@CurrentUser() user: AuthenticatedUser) {
    return this.stores.overview(user.id);
  }

  @Post() create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.stores.create(user, parseStoreProfile(body));
  }

  @Patch() update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.stores.update(user.id, parseStoreUpdate(body));
  }

  @Put("hours") hours(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.stores.setOpeningHours(user.id, parseOpeningHours(body));
  }

  @Post("accepting-orders") @HttpCode(200) accepting(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.stores.setAcceptingOrders(user.id, parseAcceptingOrders(body));
  }

  @Post("publication") @HttpCode(200) publication(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.stores.setPublished(user.id, parsePublished(body));
  }
}
