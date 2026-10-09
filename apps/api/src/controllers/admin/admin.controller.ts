import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UnsupportedMediaTypeException,
  UseGuards
} from "@nestjs/common";
import type { Response } from "express";
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
import { ApplicationMediaService } from "../../services/merchant/application-media.service.js";
import { MerchantApplicationService } from "../../services/merchant/merchant-application.service.js";
import { PRIVATE_IMAGE_HEADERS } from "../merchant/merchant-application.controller.js";

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
    private readonly applications: MerchantApplicationService,
    private readonly media: ApplicationMediaService
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

  @Get("stores/:id") store(@Param("id") id: string) {
    return this.admin.storeDetail(id);
  }

  @Get("stores/:id/customer-view") storeCustomerView(@Param("id") id: string) {
    return this.admin.storeCustomerView(id);
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

  /** A submitted application image; private, never part of the public catalog. */
  @Get("merchant-applications/:id/media/:mediaId") async applicationMedia(
    @Param("id") id: string,
    @Param("mediaId") mediaId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    const { item, stream } = await this.media.openForAdmin(id, mediaId);
    response.set(PRIVATE_IMAGE_HEADERS);
    return new StreamableFile(stream, {
      type: item.contentType,
      length: item.byteSize
    });
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
