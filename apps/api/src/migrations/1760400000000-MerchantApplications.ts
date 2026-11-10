import type { MigrationInterface, QueryRunner } from "typeorm";
/**
 * Merchant applications: an owner applies (or an Admin adds them), an Admin
 * decides, and approval grants the MERCHANT role and creates a hidden store.
 * Existing merchants and stores are untouched.
 */
export class MerchantApplications1760400000000 implements MigrationInterface {
  name = "MerchantApplications1760400000000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "merchant_application_status" AS ENUM ('DRAFT','PENDING_REVIEW','CHANGES_REQUESTED','APPROVED','REJECTED')`
    );
    await q.query(
      `CREATE TYPE "merchant_application_source" AS ENUM ('SELF','ADMIN')`
    );
    await q.query(
      `CREATE TABLE "merchant_applications" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" varchar(12) NOT NULL, "phone" varchar(16) NOT NULL, "applicant_user_id" uuid, "source" "merchant_application_source" NOT NULL, "status" "merchant_application_status" NOT NULL, "store_name" varchar(120) NOT NULL, "category" "store_category" NOT NULL, "contact_phone" varchar(20) NOT NULL, "address_line" varchar(255) NOT NULL, "description" text, "contact_name" varchar(80) NOT NULL, "review_note" varchar(500), "submitted_at" timestamptz, "decided_at" timestamptz, "decided_by_user_id" uuid, "activated_at" timestamptz, "store_id" uuid, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_merchant_applications" PRIMARY KEY ("id"), CONSTRAINT "UQ_merchant_applications_code" UNIQUE ("code"), CONSTRAINT "UQ_merchant_applications_store" UNIQUE ("store_id"), CONSTRAINT "FK_merchant_applications_applicant" FOREIGN KEY ("applicant_user_id") REFERENCES "users"("id") ON DELETE RESTRICT, CONSTRAINT "FK_merchant_applications_decider" FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT, CONSTRAINT "FK_merchant_applications_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT, CONSTRAINT "CHK_merchant_applications_activation" CHECK (("activated_at" IS NULL) = ("store_id" IS NULL) AND ("activated_at" IS NULL OR "status" = 'APPROVED')))`
    );
    // One application in flight per phone; a rejected one may be followed by a new one.
    await q.query(
      `CREATE UNIQUE INDEX "UQ_merchant_applications_open_phone" ON "merchant_applications" ("phone") WHERE "status" <> 'REJECTED'`
    );
    await q.query(
      `CREATE INDEX "IDX_merchant_applications_status" ON "merchant_applications" ("status", "updated_at")`
    );
    await q.query(
      `CREATE TABLE "merchant_application_events" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "application_id" uuid NOT NULL, "from_status" "merchant_application_status", "to_status" "merchant_application_status" NOT NULL, "action" varchar(32) NOT NULL, "actor_user_id" uuid NOT NULL, "note" varchar(500), "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_merchant_application_events" PRIMARY KEY ("id"), CONSTRAINT "FK_merchant_application_events_application" FOREIGN KEY ("application_id") REFERENCES "merchant_applications"("id") ON DELETE RESTRICT, CONSTRAINT "FK_merchant_application_events_actor" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`
    );
    await q.query(
      `CREATE INDEX "IDX_merchant_application_events_application" ON "merchant_application_events" ("application_id", "created_at")`
    );
  }
  async down(q: QueryRunner): Promise<void> {
    const rows = (await q.query(
      `SELECT count(*)::int AS n FROM "merchant_applications"`
    )) as { n: number }[];
    if (rows[0]!.n > 0)
      throw new Error(
        "Cannot revert MerchantApplications: applications and their review history would be lost."
      );
    await q.query(`DROP TABLE "merchant_application_events"`);
    await q.query(`DROP TABLE "merchant_applications"`);
    await q.query(`DROP TYPE "merchant_application_source"`);
    await q.query(`DROP TYPE "merchant_application_status"`);
  }
}
