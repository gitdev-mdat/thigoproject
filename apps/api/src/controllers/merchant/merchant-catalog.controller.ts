import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import {
  parseCategoryName,
  parseCategoryUpdate,
  parseMoveDirection,
  parseProduct,
  parseProductUpdate
} from "../../dto/merchant/storefront.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  CurrentUser,
  RequireRole,
  RoleGuard,
  type AuthenticatedUser
} from "../../guards/role.guard.js";
import { MerchantCatalogService } from "../../services/merchant/merchant-catalog.service.js";

@Controller("merchant")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.MERCHANT)
export class MerchantCatalogController {
  constructor(private readonly catalog: MerchantCatalogService) {}

  @Get("catalog") list(@CurrentUser() user: AuthenticatedUser) {
    return this.catalog.catalog(user.id);
  }

  @Post("categories") createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.catalog.createCategory(user.id, parseCategoryName(body));
  }

  @Patch("categories/:id") updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.catalog.updateCategory(user.id, id, parseCategoryUpdate(body));
  }

  @Post("categories/:id/move") @HttpCode(200) moveCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.catalog.moveCategory(user.id, id, parseMoveDirection(body));
  }

  @Delete("categories/:id") deleteCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.catalog.deleteCategory(user.id, id);
  }

  @Post("products") createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ) {
    return this.catalog.createProduct(user.id, parseProduct(body));
  }

  @Patch("products/:id") updateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.catalog.updateProduct(user.id, id, parseProductUpdate(body));
  }

  @Post("products/:id/move") @HttpCode(200) moveProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.catalog.moveProduct(user.id, id, parseMoveDirection(body));
  }

  @Delete("products/:id") removeProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.catalog.removeProduct(user.id, id);
  }
}
