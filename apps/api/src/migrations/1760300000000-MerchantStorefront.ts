import type { MigrationInterface, QueryRunner } from "typeorm";
export class MerchantStorefront1760300000000 implements MigrationInterface {
  name = "MerchantStorefront1760300000000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE "stores" ADD "phone" varchar(20), ADD "logo_image_url" varchar(500), ADD "is_accepting_orders" boolean NOT NULL DEFAULT true, ADD "opening_hours" jsonb`
    );
    // Stores created by merchants start unpublished; seeded rows keep their state.
    await q.query(`ALTER TABLE "stores" ALTER "is_active" SET DEFAULT false`);
    await q.query(`ALTER TABLE "products" ADD "archived_at" timestamptz`);
    await q.query(
      `ALTER TABLE "products" DROP CONSTRAINT "UQ_products_store_name"`
    );
    await q.query(
      `CREATE UNIQUE INDEX "UQ_products_store_name_live" ON "products" ("store_id", "name") WHERE "archived_at" IS NULL`
    );
    await q.query(
      `CREATE TABLE "media_assets" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "store_id" uuid NOT NULL, "uploaded_by_user_id" uuid NOT NULL, "content_type" varchar(32) NOT NULL, "byte_size" integer NOT NULL, "sha256" char(64) NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_media_assets" PRIMARY KEY ("id"), CONSTRAINT "CHK_media_assets_type" CHECK ("content_type" IN ('image/jpeg','image/png','image/webp')), CONSTRAINT "CHK_media_assets_size" CHECK ("byte_size" > 0), CONSTRAINT "FK_media_assets_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT, CONSTRAINT "FK_media_assets_uploader" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`
    );
    await q.query(
      `CREATE INDEX "IDX_media_assets_store" ON "media_assets" ("store_id")`
    );
  }
  async down(q: QueryRunner): Promise<void> {
    const archived = (await q.query(
      `SELECT count(*)::int AS n FROM "products" WHERE "archived_at" IS NOT NULL`
    )) as { n: number }[];
    if (archived[0]!.n > 0)
      throw new Error(
        "Cannot revert MerchantStorefront: archived products would become live and may break the old unique (store_id, name) rule."
      );
    await q.query(`DROP TABLE "media_assets"`);
    await q.query(`DROP INDEX "UQ_products_store_name_live"`);
    await q.query(
      `ALTER TABLE "products" ADD CONSTRAINT "UQ_products_store_name" UNIQUE ("store_id", "name")`
    );
    await q.query(`ALTER TABLE "products" DROP COLUMN "archived_at"`);
    await q.query(`ALTER TABLE "stores" ALTER "is_active" SET DEFAULT true`);
    await q.query(
      `ALTER TABLE "stores" DROP COLUMN "opening_hours", DROP COLUMN "is_accepting_orders", DROP COLUMN "logo_image_url", DROP COLUMN "phone"`
    );
  }
}
