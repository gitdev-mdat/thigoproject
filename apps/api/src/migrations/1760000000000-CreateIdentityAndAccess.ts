import type { MigrationInterface, QueryRunner } from "typeorm";
export class CreateIdentityAndAccess1760000000000 implements MigrationInterface {
  name = "CreateIdentityAndAccess1760000000000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "user_roles_role_enum" AS ENUM ('CUSTOMER','MERCHANT','DRIVER','ADMIN')`
    );
    await q.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "phone" varchar(16) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "UQ_users_phone" UNIQUE ("phone"), CONSTRAINT "PK_users" PRIMARY KEY ("id"))`
    );
    await q.query(
      `CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role" "user_roles_role_enum" NOT NULL, CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id","role"), CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`
    );
    await q.query(
      `CREATE TABLE "otp_challenges" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "phone" varchar(16) NOT NULL, "otp_hash" varchar(128) NOT NULL, "expires_at" timestamptz NOT NULL, "attempt_count" integer NOT NULL DEFAULT 0, "attempt_limit" integer NOT NULL, "resend_after" timestamptz NOT NULL, "consumed_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_otp_challenges" PRIMARY KEY ("id"))`
    );
    await q.query(
      `CREATE INDEX "IDX_otp_phone_created" ON "otp_challenges" ("phone", "created_at")`
    );
    await q.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "token_hash" varchar(64) NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "expires_at" timestamptz NOT NULL, "revoked_at" timestamptz, CONSTRAINT "UQ_sessions_token_hash" UNIQUE ("token_hash"), CONSTRAINT "PK_sessions" PRIMARY KEY ("id"), CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "sessions"`);
    await q.query(`DROP TABLE "otp_challenges"`);
    await q.query(`DROP TABLE "user_roles"`);
    await q.query(`DROP TABLE "users"`);
    await q.query(`DROP TYPE "user_roles_role_enum"`);
  }
}
