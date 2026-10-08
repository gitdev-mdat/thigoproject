import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { parseRejectReason } from "../../dto/ordering/ordering.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  CurrentUser,
  RequireRole,
  RoleGuard,
  type AuthenticatedUser
} from "../../guards/role.guard.js";
import { MerchantOrderService } from "../../services/ordering/merchant-order.service.js";

@Controller("merchant/orders")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.MERCHANT)
export class MerchantOrderController {
  constructor(private readonly orders: MerchantOrderService) {}

  @Get() overview(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.overview(user.id);
  }

  @Post(":id/accept") @HttpCode(200) accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.orders.act(user.id, id, "accept");
  }

  @Post(":id/reject") @HttpCode(200) reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.orders.act(user.id, id, "reject", parseRejectReason(body));
  }

  @Post(":id/prepare") @HttpCode(200) prepare(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.orders.act(user.id, id, "prepare");
  }

  @Post(":id/ready") @HttpCode(200) ready(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.orders.act(user.id, id, "ready");
  }
}
