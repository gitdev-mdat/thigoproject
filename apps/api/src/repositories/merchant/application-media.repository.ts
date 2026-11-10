import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { EDITABLE_STATUSES } from "../../common/merchant/application-lifecycle.js";
import {
  ApplicationMediaKind,
  MerchantApplicationMedia
} from "../../entities/merchant/merchant-application-media.entity.js";
import type { MerchantApplicationStatus } from "../../entities/merchant/merchant-application.entity.js";

export type AddMediaResult =
  | {
      ok: true;
      created: MerchantApplicationMedia;
      replaced: MerchantApplicationMedia | null;
    }
  | { ok: false; reason: "not_editable" | "too_many" };

/** Rows for private application images; the bytes live in MediaFileStore. */
@Injectable()
export class ApplicationMediaRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  list(applicationId: string): Promise<MerchantApplicationMedia[]> {
    return this.db.getRepository(MerchantApplicationMedia).find({
      where: { applicationId },
      order: { createdAt: "ASC", id: "ASC" }
    });
  }

  find(
    id: string,
    applicationId: string
  ): Promise<MerchantApplicationMedia | null> {
    return this.db
      .getRepository(MerchantApplicationMedia)
      .findOne({ where: { id, applicationId } });
  }

  /**
   * Adds an image under a lock on the application row, so the editable
   * status, the photo limit and the single logo/cover rule hold even for
   * parallel uploads or an upload racing a submit. A logo or cover replaces
   * the previous one; the replaced row is returned so its file can go.
   */
  async add(
    values: Omit<MerchantApplicationMedia, "createdAt">,
    applicantUserId: string,
    maxPhotos: number
  ): Promise<AddMediaResult> {
    return this.db.transaction(async (manager) => {
      const [application] = (await manager.query(
        `SELECT status FROM merchant_applications WHERE id = $1 AND applicant_user_id = $2 FOR UPDATE`,
        [values.applicationId, applicantUserId]
      )) as { status: MerchantApplicationStatus }[];
      if (!application || !EDITABLE_STATUSES.includes(application.status))
        return { ok: false, reason: "not_editable" } as const;
      const repository = manager.getRepository(MerchantApplicationMedia);
      let replaced: MerchantApplicationMedia | null = null;
      if (values.kind === ApplicationMediaKind.PHOTO) {
        const photos = await repository.count({
          where: {
            applicationId: values.applicationId,
            kind: ApplicationMediaKind.PHOTO
          }
        });
        if (photos >= maxPhotos)
          return { ok: false, reason: "too_many" } as const;
      } else {
        replaced = await repository.findOne({
          where: { applicationId: values.applicationId, kind: values.kind }
        });
        if (replaced) await repository.delete({ id: replaced.id });
      }
      const created = await repository.save(repository.create(values));
      return { ok: true, created, replaced } as const;
    });
  }

  /** Removes an image only while the application is still editable. */
  async removeIfEditable(
    id: string,
    applicationId: string,
    applicantUserId: string
  ): Promise<boolean> {
    return this.db.transaction(async (manager) => {
      const [application] = (await manager.query(
        `SELECT status FROM merchant_applications WHERE id = $1 AND applicant_user_id = $2 FOR UPDATE`,
        [applicationId, applicantUserId]
      )) as { status: MerchantApplicationStatus }[];
      if (!application || !EDITABLE_STATUSES.includes(application.status))
        return false;
      const result = await manager
        .getRepository(MerchantApplicationMedia)
        .delete({ id, applicationId });
      return result.affected === 1;
    });
  }
}
