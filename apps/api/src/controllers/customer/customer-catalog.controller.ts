import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards
} from "@nestjs/common";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import { RequireRole, RoleGuard } from "../../guards/role.guard.js";
import {
  CustomerCatalogService,
  parseStoreCategory
} from "../../services/catalog/customer-catalog.service.js";

@Controller("customer")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.CUSTOMER)
export class CustomerCatalogController {
  constructor(private readonly catalog: CustomerCatalogService) {}

  @Get("recommendations") recommendations(@Query("category") value?: string) {
    const category = parseStoreCategory(value);
    if (!category) throw new BadRequestException("Danh mục không hợp lệ.");
    return this.catalog.recommendations(category);
  }

  @Get("search") search(@Query("q") query?: string) {
    return this.catalog.search(typeof query === "string" ? query : "");
  }

  @Get("stores/:id") store(@Param("id") id: string) {
    return this.catalog.store(id);
  }
}
