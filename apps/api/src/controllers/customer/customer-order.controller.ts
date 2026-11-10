import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import {
  parseAddressInput,
  parseCartInput,
  parsePlaceOrderInput
} from "../../dto/ordering/ordering.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  CurrentUser,
  RequireRole,
  RoleGuard,
  type AuthenticatedUser
} from "../../guards/role.guard.js";
import { AddressService } from "../../services/ordering/address.service.js";
import { CheckoutService } from "../../services/ordering/checkout.service.js";
import { CustomerOrderService } from "../../services/ordering/customer-order.service.js";

@Controller("customer")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.CUSTOMER)
export class CustomerOrderController {
  constructor(
    private readonly addresses: AddressService,
    private readonly checkout: CheckoutService,
    private readonly orders: CustomerOrderService
  ) {}

  @Get("home") home(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.home(user.id);
  }

  @Get("addresses") async listAddresses(
    @CurrentUser() user: AuthenticatedUser
  ) {
    return { addresses: await this.addresses.list(user.id) };
  }

  @Post("addresses") createAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.addresses.create(user.id, parseAddressInput(body));
  }

  @Post("addresses/:id/default") @HttpCode(200) makeDefault(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.addresses.makeDefault(user.id, id);
  }

  @Delete("addresses/:id") @HttpCode(204) async removeAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    await this.addresses.remove(user.id, id);
  }

  @Post("checkout/quote") @HttpCode(200) quote(@Body() body: unknown) {
    return this.checkout.quote(parseCartInput(body));
  }

  @Post("orders") placeOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.checkout.place(user, parsePlaceOrderInput(body));
  }

  @Get("orders") async listOrders(@CurrentUser() user: AuthenticatedUser) {
    return { orders: await this.orders.list(user.id) };
  }

  @Get("orders/:id") order(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.orders.detail(user.id, id);
  }

  @Post("orders/:id/cancel") @HttpCode(200) cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.orders.cancel(user.id, id);
  }
}
