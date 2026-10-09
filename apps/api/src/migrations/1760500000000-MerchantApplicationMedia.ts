import type { MigrationInterface, QueryRunner } from "typeorm";
/**
 * Images an applicant attaches for review. They are kept apart from
 * media_assets, so the public GET /media/:id never serves them and approval
 * never turns them into storefront images.
 */
export class MerchantApplicationMedia1760500000000 implements MigrationInterface {
  name = "MerchantApplicationMedia1760500000000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "merchant_application_media_kind" AS ENUM ('LOGO','COVER','PHOTO')`
    );
    await q.query(
      `CREATE TABLE "merchant_application_media" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "application_id" uuid NOT NULL, "kind" "merchant_application_media_kind" NOT NULL, "uploaded_by_user_id" uuid NOT NULL, "content_type" varchar(32) NOT NULL, "byte_size" integer NOT NULL, "sha256" char(64) NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_merchant_application_media" PRIMARY KEY ("id"), CONSTRAINT "CHK_merchant_application_media_type" CHECK ("content_type" IN ('image/jpeg','image/png','image/webp')), CONSTRAINT "CHK_merchant_application_media_size" CHECK ("byte_size" > 0), CONSTRAINT "FK_merchant_application_media_application" FOREIGN KEY ("application_id") REFERENCES "merchant_applications"("id") ON DELETE RESTRICT, CONSTRAINT "FK_merchant_application_media_uploader" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`
    );
    await q.query(
      `CREATE INDEX "IDX_merchant_application_media_application" ON "merchant_application_media" ("application_id", "created_at")`
    );
    // One logo and one cover per application; photos are counted by the service.
    await q.query(
      `CREATE UNIQUE INDEX "UQ_merchant_application_media_single" ON "merchant_application_media" ("application_id", "kind") WHERE "kind" <> 'PHOTO'`
    );
  }
  async down(q: QueryRunner): Promise<void> {
    const rows = (await q.query(
      `SELECT count(*)::int AS n FROM "merchant_application_media"`
    )) as { n: number }[];
    if (rows[0]!.n > 0)
      throw new Error(
        "Cannot revert MerchantApplicationMedia: submitted application images would be lost."
      );
    await q.query(`DROP TABLE "merchant_application_media"`);
    await q.query(`DROP TYPE "merchant_application_media_kind"`);
  }
}
