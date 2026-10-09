import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  UnsupportedMediaTypeException,
  UseGuards
} from "@nestjs/common";
import {
  parseApplicationListQuery,
  parseOrderListQuery,
  parsePage,
  parseStoreListQuery,
  parseUserListQuery
} from "../../dto/admin/admin.dto.js";
import {
  parseAdminApplicationInput,
  parseReviewReason
} from "../../dto/merchant/application.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  CurrentUser,
  RequireRole,
  RoleGuard,
  type AuthenticatedUser
} from "../../guards/role.guard.js";
import { AdminService } from "../../services/admin/admin.service.js";
import { MerchantApplicationService } from "../../services/merchant/merchant-application.service.js";

/**
 * Cookie-authenticated writes accept JSON only. A cross-site form cannot send
 * that content type without a CORS preflight, which only ADMIN_WEB_ORIGIN passes.
 */
function requireJson(contentType: string | undefined) {
  if (!contentType?.toLowerCase().startsWith("application/json"))
    throw new UnsupportedMediaTypeException();
}

/** Operations views, plus the partner application decisions. */
@Controller("admin")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly applications: MerchantApplicationService
  ) {}

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

  @Get("merchant-applications") listApplications(
    @Query() query: Record<string, unknown>
  ) {
    return this.applications.list(parseApplicationListQuery(query));
  }

  @Get("merchant-applications/:id") application(@Param("id") id: string) {
    return this.applications.detail(id);
  }

  /** Admin-assisted onboarding: the application starts approved. */
  @Post("merchant-applications") createApplication(
    @CurrentUser() admin: AuthenticatedUser,
    @Headers("content-type") contentType: string | undefined,
    @Body() body: unknown
  ) {
    requireJson(contentType);
    return this.applications.createForPartner(
      admin,
      parseAdminApplicationInput(body)
    );
  }

  @Post("merchant-applications/:id/approve") @HttpCode(200) approve(
    @CurrentUser() admin: AuthenticatedUser,
    @Headers("content-type") contentType: string | undefined,
    @Param("id") id: string
  ) {
    requireJson(contentType);
    return this.applications.decide(admin, id, "APPROVE", null);
  }

  @Post("merchant-applications/:id/request-changes")
  @HttpCode(200)
  requestChanges(
    @CurrentUser() admin: AuthenticatedUser,
    @Headers("content-type") contentType: string | undefined,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    requireJson(contentType);
    return this.applications.decide(
      admin,
      id,
      "REQUEST_CHANGES",
      parseReviewReason(body)
    );
  }

  @Post("merchant-applications/:id/reject") @HttpCode(200) reject(
    @CurrentUser() admin: AuthenticatedUser,
    @Headers("content-type") contentType: string | undefined,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    requireJson(contentType);
    return this.applications.decide(
      admin,
      id,
      "REJECT",
      parseReviewReason(body)
    );
  }
}
