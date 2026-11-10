import type { MigrationInterface, QueryRunner } from "typeorm";

export class DispatchOffersAndEarnings1760700000000 implements MigrationInterface {
  name = "DispatchOffersAndEarnings1760700000000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "delivery_job_status" AS ENUM ('PENDING','OFFERING','ASSIGNED','COMPLETED','CANCELLED','EXHAUSTED')`
    );
    await q.query(
      `CREATE TYPE "delivery_offer_status" AS ENUM ('PENDING','ACCEPTED','REJECTED','EXPIRED','CANCELLED')`
    );
    await q.query(
      `CREATE TYPE "delivery_eta_source" AS ENUM ('ROUTING','ESTIMATED')`
    );
    await q.query(
      `CREATE TABLE "delivery_jobs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "order_id" uuid NOT NULL, "status" "delivery_job_status" NOT NULL DEFAULT 'PENDING', "attempt" integer NOT NULL DEFAULT 0, "next_dispatch_at" timestamptz NOT NULL DEFAULT now(), "assigned_driver_user_id" uuid, "completed_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_delivery_jobs" PRIMARY KEY ("id"), CONSTRAINT "UQ_delivery_jobs_order" UNIQUE ("order_id"), CONSTRAINT "CHK_delivery_jobs_attempt" CHECK ("attempt" >= 0), CONSTRAINT "FK_delivery_jobs_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE, CONSTRAINT "FK_delivery_jobs_driver" FOREIGN KEY ("assigned_driver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`
    );
    await q.query(
      `CREATE INDEX "IDX_delivery_jobs_due" ON "delivery_jobs" ("next_dispatch_at", "status") WHERE "status" IN ('PENDING','OFFERING')`
    );
    await q.query(
      `CREATE TABLE "delivery_offers" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "job_id" uuid NOT NULL, "driver_user_id" uuid NOT NULL, "status" "delivery_offer_status" NOT NULL, "rank" integer NOT NULL, "straight_line_distance_meters" integer NOT NULL, "pickup_eta_seconds" integer NOT NULL, "eta_source" "delivery_eta_source" NOT NULL, "offered_at" timestamptz NOT NULL DEFAULT now(), "expires_at" timestamptz NOT NULL, "responded_at" timestamptz, CONSTRAINT "PK_delivery_offers" PRIMARY KEY ("id"), CONSTRAINT "UQ_delivery_offers_job_driver" UNIQUE ("job_id", "driver_user_id"), CONSTRAINT "CHK_delivery_offers_metrics" CHECK ("rank" > 0 AND "straight_line_distance_meters" >= 0 AND "pickup_eta_seconds" > 0), CONSTRAINT "CHK_delivery_offers_expiry" CHECK ("expires_at" > "offered_at"), CONSTRAINT "FK_delivery_offers_job" FOREIGN KEY ("job_id") REFERENCES "delivery_jobs"("id") ON DELETE CASCADE, CONSTRAINT "FK_delivery_offers_driver" FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`
    );
    await q.query(
      `CREATE UNIQUE INDEX "UQ_delivery_offers_one_pending" ON "delivery_offers" ("job_id") WHERE "status" = 'PENDING'`
    );
    await q.query(
      `CREATE INDEX "IDX_delivery_offers_driver_status" ON "delivery_offers" ("driver_user_id", "status", "expires_at")`
    );
    await q.query(
      `CREATE TABLE "driver_earnings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "order_id" uuid NOT NULL, "driver_user_id" uuid NOT NULL, "amount_vnd" integer NOT NULL, "source" varchar(40) NOT NULL DEFAULT 'DELIVERY_FEE', "earned_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_driver_earnings" PRIMARY KEY ("id"), CONSTRAINT "UQ_driver_earnings_order" UNIQUE ("order_id"), CONSTRAINT "CHK_driver_earnings_amount" CHECK ("amount_vnd" >= 0), CONSTRAINT "FK_driver_earnings_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT, CONSTRAINT "FK_driver_earnings_driver" FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`
    );
    await q.query(
      `CREATE INDEX "IDX_driver_earnings_driver_earned" ON "driver_earnings" ("driver_user_id", "earned_at" DESC)`
    );
    await q.query(
      `CREATE TABLE "delivery_events" ("id" bigserial NOT NULL, "job_id" uuid, "order_id" uuid NOT NULL, "driver_user_id" uuid, "type" varchar(50) NOT NULL, "details" jsonb NOT NULL DEFAULT '{}', "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_delivery_events" PRIMARY KEY ("id"), CONSTRAINT "FK_delivery_events_job" FOREIGN KEY ("job_id") REFERENCES "delivery_jobs"("id") ON DELETE SET NULL, CONSTRAINT "FK_delivery_events_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE, CONSTRAINT "FK_delivery_events_driver" FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE SET NULL)`
    );
    await q.query(
      `CREATE INDEX "IDX_delivery_events_order_created" ON "delivery_events" ("order_id", "created_at")`
    );
    await q.query(
      `CREATE INDEX "IDX_driver_presence_dispatch" ON "driver_presence" ("last_heartbeat_at", "location_recorded_at") WHERE "is_online"`
    );
    await q.query(
      `CREATE INDEX "IDX_orders_dispatchable" ON "orders" ("ready_at", "id") WHERE "driver_user_id" IS NULL AND "status" = 'READY_FOR_PICKUP'`
    );
    await q.query(
      `CREATE UNIQUE INDEX "UQ_orders_driver_active" ON "orders" ("driver_user_id") WHERE "driver_user_id" IS NOT NULL AND "status" IN ('ACCEPTED','PREPARING','READY_FOR_PICKUP','PICKED_UP')`
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX "UQ_orders_driver_active"`);
    await q.query(`DROP INDEX "IDX_orders_dispatchable"`);
    await q.query(`DROP INDEX "IDX_driver_presence_dispatch"`);
    await q.query(`DROP TABLE "delivery_events"`);
    await q.query(`DROP TABLE "driver_earnings"`);
    await q.query(`DROP TABLE "delivery_offers"`);
    await q.query(`DROP TABLE "delivery_jobs"`);
    await q.query(`DROP TYPE "delivery_eta_source"`);
    await q.query(`DROP TYPE "delivery_offer_status"`);
    await q.query(`DROP TYPE "delivery_job_status"`);
  }
}
