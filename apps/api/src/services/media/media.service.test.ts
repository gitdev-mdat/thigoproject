import { HttpException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { MediaRepository } from "../../repositories/media/media.repository.js";
import type { MediaFileStore } from "../../repositories/media/media-file.store.js";
import type { StorefrontRepository } from "../../repositories/merchant/storefront.repository.js";
import { MAX_UPLOADS_PER_MINUTE, MediaService } from "./media.service.js";

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489",
  "hex"
);
const USED = "/media/11111111-1111-4111-8111-111111111111";
const FREE = "/media/22222222-2222-4222-8222-222222222222";

function setup() {
  const media = {
    countForStore: vi.fn(async () => 0),
    create: vi.fn(async () => ({
      id: "33333333-3333-4333-8333-333333333333",
      byteSize: PNG.length
    })),
    isReferenced: vi.fn(async (url: string) => url === USED),
    remove: vi.fn(async () => undefined)
  };
  const files = {
    write: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined)
  };
  const stores = { findStoreByOwner: vi.fn(async () => ({ id: "store-a" })) };
  const service = new MediaService(
    media as unknown as MediaRepository,
    files as unknown as MediaFileStore,
    stores as unknown as StorefrontRepository
  );
  return { service, media, files };
}

describe("media service", () => {
  it("limits how fast one merchant can upload", async () => {
    const { service } = setup();
    const user = { id: "user-a" } as never;
    for (let i = 0; i < MAX_UPLOADS_PER_MINUTE; i += 1)
      await service.upload(user, { buffer: PNG, size: PNG.length });
    const error = await service
      .upload(user, { buffer: PNG, size: PNG.length })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    // Another merchant is not affected.
    await expect(
      service.upload({ id: "user-b" } as never, {
        buffer: PNG,
        size: PNG.length
      })
    ).resolves.toMatchObject({ contentType: "image/png" });
  });

  it("deletes only detached images nothing else shows", async () => {
    const { service, media, files } = setup();
    await service.releaseUnused([
      USED,
      FREE,
      null,
      "/media/dev/food.png",
      FREE
    ]);
    expect(media.isReferenced).toHaveBeenCalledTimes(2);
    expect(media.remove).toHaveBeenCalledExactlyOnceWith(FREE.slice(7));
    expect(files.remove).toHaveBeenCalledExactlyOnceWith(FREE.slice(7));
  });
});
