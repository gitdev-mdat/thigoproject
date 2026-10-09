import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  parseOrderListQuery,
  parsePage,
  parseStoreListQuery,
  parseUserListQuery
} from "../../dto/admin/admin.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import { RequireRole, RoleGuard } from "../../guards/role.guard.js";
import { AdminService } from "../../services/admin/admin.service.js";

/** Read-only operations views. Mutations are deliberately not offered yet. */
@Controller("admin")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("overview") overview() {
    return this.admin.overview();
  }

  @Get("orders") orders(@Query() query: Record<string, unknown>) {
    return this.admin.orders(parseOrderListQuery(query));
  }

  @Get("stores") stores(@Query() query: Record<string, unknown>) {
    return this.admin.stores(parseStoreListQuery(query));
  }

  @Get("users") users(@Query() query: Record<string, unknown>) {
    return this.admin.users(parseUserListQuery(query));
  }

  @Get("drivers") drivers(@Query() query: Record<string, unknown>) {
    return this.admin.drivers(parsePage(query));
  }
}
