import { createHash, randomUUID } from "node:crypto";
import type { ReadStream } from "node:fs";
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException
} from "@nestjs/common";
import { EDITABLE_STATUSES } from "../../common/merchant/application-lifecycle.js";
import { isUuid } from "../../dto/merchant/storefront.dto.js";
import {
  ApplicationMediaKind,
  type MerchantApplicationMedia
} from "../../entities/merchant/merchant-application-media.entity.js";
import type { MerchantApplication } from "../../entities/merchant/merchant-application.entity.js";
import type { AuthenticatedUser } from "../../guards/role.guard.js";
import { MediaFileStore } from "../../repositories/media/media-file.store.js";
import {
  ApplicationMediaRepository,
  type AddMediaResult
} from "../../repositories/merchant/application-media.repository.js";
import { MerchantApplicationRepository } from "../../repositories/merchant/merchant-application.repository.js";
import { MAX_IMAGE_BYTES, detectImageType } from "../media/image-validation.js";

/** A logo, a cover and a few photos are enough to judge a storefront. */
export const MAX_APPLICATION_PHOTOS = 4;
const MAX_UPLOADS_PER_MINUTE = 10;
const MINUTE_MS = 60_000;

export interface ApplicationMediaDto {
  id: string;
  kind: ApplicationMediaKind;
  contentType: string;
  byteSize: number;
  createdAt: string;
  /** Authenticated URL for whoever is asking (applicant or Admin). */
  url: string;
}

const uniqueViolation = (error: unknown) =>
  ((error as { code?: string; driverError?: { code?: string } })?.code ??
    (error as { driverError?: { code?: string } })?.driverError?.code) ===
  "23505";

export function parseMediaKind(value: unknown): ApplicationMediaKind {
  const kind = Object.values(ApplicationMediaKind).find(
    (item) => item === value
  );
  if (!kind) throw new BadRequestException("Loại ảnh không hợp lệ.");
  return kind;
}

/**
 * Private images attached to a partner application. Only the applicant (for
 * their own open application) and Admins can read them; nothing here ever
 * writes media_assets, so the public /media route cannot serve them.
 */
@Injectable()
export class ApplicationMediaService {
  private readonly recentUploads = new Map<string, number[]>();

  constructor(
    private readonly media: ApplicationMediaRepository,
    private readonly applications: MerchantApplicationRepository,
    private readonly files: MediaFileStore
  ) {}

  static applicantUrl(id: string) {
    return `/merchant-applications/me/media/${id}`;
  }

  static adminUrl(applicationId: string, id: string) {
    return `/admin/merchant-applications/${applicationId}/media/${id}`;
  }

  async listForApplicant(
    applicationId: string
  ): Promise<ApplicationMediaDto[]> {
    return (await this.media.list(applicationId)).map((item) =>
      this.toDto(item, ApplicationMediaService.applicantUrl(item.id))
    );
  }

  async listForAdmin(applicationId: string): Promise<ApplicationMediaDto[]> {
    return (await this.media.list(applicationId)).map((item) =>
      this.toDto(item, ApplicationMediaService.adminUrl(applicationId, item.id))
    );
  }

  async upload(
    user: AuthenticatedUser,
    kind: ApplicationMediaKind,
    file: { buffer: Buffer; size: number } | undefined
  ): Promise<ApplicationMediaDto> {
    const application = await this.editableApplication(user);
    this.throttle(user.id);
    if (!file || !file.buffer?.length)
      throw new BadRequestException("Chưa có ảnh nào được gửi lên.");
    if (file.size > MAX_IMAGE_BYTES)
      throw new PayloadTooLargeException("Ảnh tối đa 5 MB.");
    const contentType = detectImageType(file.buffer);
    if (!contentType)
      throw new UnsupportedMediaTypeException(
        "Chỉ nhận ảnh JPG, PNG hoặc WebP."
      );
    // The file is written first, so a row never points at a missing file and
    // a failed upload never removes the image it would have replaced.
    const id = randomUUID();
    await this.files.write(id, file.buffer);
    let result: AddMediaResult;
    try {
      result = await this.media.add(
        {
          id,
          applicationId: application.id,
          kind,
          uploadedByUserId: user.id,
          contentType,
          byteSize: file.buffer.length,
          sha256: createHash("sha256").update(file.buffer).digest("hex")
        },
        user.id,
        MAX_APPLICATION_PHOTOS
      );
    } catch (error) {
      await this.files.remove(id);
      // Two logo/cover uploads at once: the partial unique index keeps one.
      if (uniqueViolation(error))
        throw new ConflictException("Ảnh vừa được thay. Vui lòng thử lại.");
      throw error;
    }
    if (!result.ok) {
      await this.files.remove(id);
      throw new ConflictException(
        result.reason === "too_many"
          ? `Hồ sơ có tối đa ${MAX_APPLICATION_PHOTOS} ảnh quán. Hãy xóa bớt ảnh cũ.`
          : "Hồ sơ đang chờ duyệt hoặc đã được duyệt nên chưa đổi được ảnh."
      );
    }
    const { created, replaced } = result;
    if (replaced) await this.files.remove(replaced.id);
    return this.toDto(
      created,
      ApplicationMediaService.applicantUrl(created.id)
    );
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const application = await this.editableApplication(user);
    const removed =
      isUuid(id) &&
      (await this.media.removeIfEditable(id, application.id, user.id));
    if (!removed) throw new NotFoundException("Không tìm thấy ảnh.");
    await this.files.remove(id);
  }

  /** The applicant reads images of their own latest application only. */
  async openForApplicant(user: AuthenticatedUser, id: string) {
    const application = await this.applications.findLatestByPhone(user.phone);
    // An invitation (no applicant yet) belongs to the OTP-verified phone.
    if (
      !application ||
      application.phone !== user.phone ||
      (application.applicantUserId !== null &&
        application.applicantUserId !== user.id)
    )
      throw new NotFoundException("Không tìm thấy ảnh.");
    return this.open(application.id, id);
  }

  async openForAdmin(applicationId: string, id: string) {
    if (!isUuid(applicationId))
      throw new NotFoundException("Không tìm thấy ảnh.");
    return this.open(applicationId, id);
  }

  private async open(
    applicationId: string,
    id: string
  ): Promise<{ item: MerchantApplicationMedia; stream: ReadStream }> {
    const item = isUuid(id) ? await this.media.find(id, applicationId) : null;
    const stream = item ? await this.files.open(item.id) : null;
    if (!item || !stream) throw new NotFoundException("Không tìm thấy ảnh.");
    return { item, stream };
  }

  /** Images change only while the applicant still owns the next step. */
  private async editableApplication(
    user: AuthenticatedUser
  ): Promise<MerchantApplication> {
    const application = await this.applications.findOpenByPhone(user.phone);
    if (!application || application.applicantUserId !== user.id)
      throw new BadRequestException(
        "Hãy lưu thông tin hồ sơ trước khi thêm ảnh."
      );
    if (!EDITABLE_STATUSES.includes(application.status))
      throw new ConflictException(
        "Hồ sơ đang chờ duyệt hoặc đã được duyệt nên chưa đổi được ảnh."
      );
    return application;
  }

  private toDto(item: MerchantApplicationMedia, url: string) {
    return {
      id: item.id,
      kind: item.kind,
      contentType: item.contentType,
      byteSize: item.byteSize,
      createdAt: item.createdAt.toISOString(),
      url
    };
  }

  private throttle(userId: string, now = Date.now()): void {
    const recent = (this.recentUploads.get(userId) ?? []).filter(
      (at) => now - at < MINUTE_MS
    );
    if (recent.length >= MAX_UPLOADS_PER_MINUTE)
      throw new HttpException(
        "Bạn đang tải ảnh quá nhanh. Vui lòng thử lại sau ít phút.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    recent.push(now);
    this.recentUploads.set(userId, recent);
    if (this.recentUploads.size > 10_000)
      for (const [key, times] of this.recentUploads)
        if (times.every((at) => now - at >= MINUTE_MS))
          this.recentUploads.delete(key);
  }
}
