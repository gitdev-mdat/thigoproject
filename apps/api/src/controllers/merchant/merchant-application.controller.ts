import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { parseApplicationInput } from "../../dto/merchant/application.dto.js";
import {
  CurrentUser,
  type AuthenticatedUser
} from "../../guards/role.guard.js";
import { SessionGuard } from "../../guards/session.guard.js";
import {
  ApplicationMediaService,
  parseMediaKind
} from "../../services/merchant/application-media.service.js";
import { MerchantApplicationService } from "../../services/merchant/merchant-application.service.js";
import { MAX_IMAGE_BYTES } from "../../services/media/image-validation.js";

/** Private images are never cached by shared caches and never run as documents. */
export const PRIVATE_IMAGE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox"
};

/**
 * The signed-in user's own partner application. Any verified phone may use
 * it; nothing here grants a role except activating an Admin approval.
 */
@Controller("merchant-applications/me")
@UseGuards(SessionGuard)
export class MerchantApplicationController {
  constructor(
    private readonly applications: MerchantApplicationService,
    private readonly media: ApplicationMediaService
  ) {}

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

  /** Multipart: `file` plus `kind` (LOGO, COVER or PHOTO). */
  @Post("media")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } })
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: { buffer: Buffer; size: number } | undefined,
    @Body() body: { kind?: unknown } | undefined
  ) {
    return this.media.upload(user, parseMediaKind(body?.kind), file);
  }

  @Delete("media/:id") @HttpCode(204) async removeMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    await this.media.remove(user, id);
  }

  @Get("media/:id") async readMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    const { item, stream } = await this.media.openForApplicant(user, id);
    response.set(PRIVATE_IMAGE_HEADERS);
    return new StreamableFile(stream, {
      type: item.contentType,
      length: item.byteSize
    });
  }
}
