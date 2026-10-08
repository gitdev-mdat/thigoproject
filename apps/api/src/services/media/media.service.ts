import { createHash } from "node:crypto";
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
import type { MediaUploadDto } from "../../dto/merchant/storefront.dto.js";
import { isUuid } from "../../dto/merchant/storefront.dto.js";
import type { MediaAsset } from "../../entities/media/media-asset.entity.js";
import type { AuthenticatedUser } from "../../guards/role.guard.js";
import { MediaFileStore } from "../../repositories/media/media-file.store.js";
import { MediaRepository } from "../../repositories/media/media.repository.js";
import { StorefrontRepository } from "../../repositories/merchant/storefront.repository.js";
import { MAX_IMAGE_BYTES, detectImageType } from "./image-validation.js";

export const MEDIA_URL_PREFIX = "/media/";
/** Uploads that were never attached are not swept yet, so cap what one store keeps. */
export const MAX_IMAGES_PER_STORE = 300;
/** Uploads per merchant per minute; enough for a burst of edits, not a flood. */
export const MAX_UPLOADS_PER_MINUTE = 20;
const MINUTE_MS = 60_000;

export function mediaUrl(id: string): string {
  return `${MEDIA_URL_PREFIX}${id}`;
}

export interface UploadedFile {
  buffer: Buffer;
  size: number;
}

@Injectable()
export class MediaService {
  /** In-memory, so it covers the approved single-instance deployment only. */
  private readonly recentUploads = new Map<string, number[]>();

  constructor(
    private readonly media: MediaRepository,
    private readonly files: MediaFileStore,
    private readonly storefront: StorefrontRepository
  ) {}

  /** Stores a merchant's image; ownership comes from the session, never the request. */
  async upload(
    user: AuthenticatedUser,
    file: UploadedFile | undefined
  ): Promise<MediaUploadDto> {
    const store = await this.storefront.findStoreByOwner(user.id);
    if (!store)
      throw new BadRequestException("Hãy tạo cửa hàng trước khi tải ảnh lên.");
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
    if ((await this.media.countForStore(store.id)) >= MAX_IMAGES_PER_STORE)
      throw new ConflictException(
        "Cửa hàng đã tải lên quá nhiều ảnh. Vui lòng liên hệ THIGO."
      );
    const asset = await this.media.create({
      storeId: store.id,
      uploadedByUserId: user.id,
      contentType,
      byteSize: file.buffer.length,
      sha256: createHash("sha256").update(file.buffer).digest("hex")
    });
    try {
      await this.files.write(asset.id, file.buffer);
    } catch (error) {
      await this.media.remove(asset.id);
      throw error;
    }
    return {
      id: asset.id,
      url: mediaUrl(asset.id),
      contentType,
      byteSize: asset.byteSize
    };
  }

  /**
   * Deletes images an edit or delete just detached, unless something else
   * (another product, the other store image, a past order) still shows them.
   * Best effort: a failure leaves an orphan, never a broken image.
   */
  async releaseUnused(urls: (string | null | undefined)[]): Promise<void> {
    for (const url of new Set(urls)) {
      const id = url?.startsWith(MEDIA_URL_PREFIX)
        ? url.slice(MEDIA_URL_PREFIX.length)
        : null;
      if (!id || !isUuid(id)) continue;
      try {
        if (await this.media.isReferenced(url!)) continue;
        await this.media.remove(id);
        await this.files.remove(id);
      } catch {
        // Leave it; the per-store cap bounds what an orphan can cost.
      }
    }
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
    if (this.recentUploads.size > 10_000) this.recentUploads.clear();
  }

  /** The URL for one of this store's uploads, or 400 when it is not theirs. */
  async ownedUrl(storeId: string, id: string): Promise<string> {
    const asset = await this.media.findForStore(id, storeId);
    if (!asset) throw new BadRequestException("Ảnh không thuộc cửa hàng này.");
    return mediaUrl(asset.id);
  }

  /** Public read: catalog images are shown to every customer. */
  async open(id: string): Promise<{ asset: MediaAsset; stream: ReadStream }> {
    const asset = isUuid(id) ? await this.media.find(id) : null;
    const stream = asset ? await this.files.open(asset.id) : null;
    if (!asset || !stream) throw new NotFoundException("Không tìm thấy ảnh.");
    return { asset, stream };
  }
}
