import { describe, expect, it, vi } from "vitest";

import {
  ApplicationMediaKind,
  type MerchantApplicationMedia
} from "../../entities/merchant/merchant-application-media.entity.js";
import {
  MerchantApplicationStatus as S,
  type MerchantApplication
} from "../../entities/merchant/merchant-application.entity.js";
import { ApplicationMediaService } from "./application-media.service.js";

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000",
  "hex"
);
const USER = {
  id: "11111111-1111-4111-8111-111111111111",
  phone: "+84861000001"
};
const APP_ID = "22222222-2222-4222-8222-222222222222";
const MEDIA_ID = "33333333-3333-4333-8333-333333333333";

function setup(application: Partial<MerchantApplication> | null) {
  const app = application
    ? ({
        id: APP_ID,
        phone: USER.phone,
        applicantUserId: USER.id,
        status: S.DRAFT,
        ...application
      } as MerchantApplication)
    : null;
  const media = {
    list: vi.fn(async () => []),
    find: vi.fn(async (id: string, applicationId: string) =>
      id === MEDIA_ID && applicationId === APP_ID
        ? ({
            id,
            applicationId,
            contentType: "image/png",
            byteSize: 10
          } as MerchantApplicationMedia)
        : null
    ),
    add: vi.fn(async (values: MerchantApplicationMedia) => ({
      ok: true as const,
      created: { ...values, createdAt: new Date() },
      replaced: null
    })),
    removeIfEditable: vi.fn(async () => true)
  };
  const applications = {
    findOpenByPhone: vi.fn(async () =>
      app && app.status !== S.REJECTED ? app : null
    ),
    findLatestByPhone: vi.fn(async () => app)
  };
  const files = {
    write: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    open: vi.fn(async () => ({}) as never)
  };
  const service = new ApplicationMediaService(
    media as never,
    applications as never,
    files as never
  );
  return { service, media, files };
}

describe("ApplicationMediaService", () => {
  it("stores an applicant image privately, file first", async () => {
    const { service, media, files } = setup({});
    const dto = await service.upload(USER, ApplicationMediaKind.LOGO, {
      buffer: PNG,
      size: PNG.length
    });
    expect(files.write).toHaveBeenCalledBefore(media.add);
    expect(dto.url).toBe(`/merchant-applications/me/media/${dto.id}`);
  });

  it.each([S.PENDING_REVIEW, S.APPROVED])(
    "refuses uploads while the application is %s",
    async (status) => {
      const { service, files } = setup({ status });
      await expect(
        service.upload(USER, ApplicationMediaKind.PHOTO, {
          buffer: PNG,
          size: PNG.length
        })
      ).rejects.toMatchObject({ status: 409 });
      expect(files.write).not.toHaveBeenCalled();
    }
  );

  it("refuses uploads to an application someone else owns", async () => {
    const { service } = setup({ applicantUserId: "someone-else" });
    await expect(
      service.upload(USER, ApplicationMediaKind.PHOTO, {
        buffer: PNG,
        size: PNG.length
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("removes the written file when the locked insert refuses", async () => {
    const { service, media, files } = setup({});
    media.add.mockResolvedValueOnce({ ok: false, reason: "too_many" } as never);
    await expect(
      service.upload(USER, ApplicationMediaKind.PHOTO, {
        buffer: PNG,
        size: PNG.length
      })
    ).rejects.toMatchObject({ status: 409 });
    expect(files.remove).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-image before writing anything", async () => {
    const { service, files } = setup({});
    await expect(
      service.upload(USER, ApplicationMediaKind.PHOTO, {
        buffer: Buffer.from("hello"),
        size: 5
      })
    ).rejects.toMatchObject({ status: 415 });
    expect(files.write).not.toHaveBeenCalled();
  });

  it("lets only the owner of the latest application read its images", async () => {
    const owner = setup({});
    await expect(
      owner.service.openForApplicant(USER, MEDIA_ID)
    ).resolves.toBeDefined();
    const other = setup({ applicantUserId: "someone-else" });
    await expect(
      other.service.openForApplicant(USER, MEDIA_ID)
    ).rejects.toMatchObject({ status: 404 });
    const none = setup(null);
    await expect(
      none.service.openForApplicant(USER, MEDIA_ID)
    ).rejects.toMatchObject({ status: 404 });
  });

  it("matches the Admin read on both the application and the image id", async () => {
    const { service } = setup({});
    await expect(service.openForAdmin(APP_ID, MEDIA_ID)).resolves.toBeDefined();
    await expect(
      service.openForAdmin("44444444-4444-4444-8444-444444444444", MEDIA_ID)
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      service.openForAdmin("not-a-uuid", MEDIA_ID)
    ).rejects.toMatchObject({ status: 404 });
  });
});
