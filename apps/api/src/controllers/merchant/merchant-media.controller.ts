import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  CurrentUser,
  RequireRole,
  RoleGuard,
  type AuthenticatedUser
} from "../../guards/role.guard.js";
import { MAX_IMAGE_BYTES } from "../../services/media/image-validation.js";
import {
  MediaService,
  type UploadedFile as UploadedImage
} from "../../services/media/media.service.js";

@Controller("merchant/media")
@UseGuards(RoleGuard)
@RequireRole(ApplicationRole.MERCHANT)
export class MerchantMediaController {
  constructor(private readonly media: MediaService) {}

  /** Multipart field `file`; the role guard runs before the body is read. */
  @Post()
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } })
  )
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedImage | undefined
  ) {
    return this.media.upload(user, file);
  }
}
