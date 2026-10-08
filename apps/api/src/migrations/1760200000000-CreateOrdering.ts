import type { MigrationInterface, QueryRunner } from "typeorm";
export class CreateOrdering1760200000000 implements MigrationInterface {
  name = "CreateOrdering1760200000000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE "customer_addresses" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "label" varchar(40) NOT NULL, "line" varchar(255) NOT NULL, "note" varchar(255), "is_default" boolean NOT NULL DEFAULT false, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_customer_addresses" PRIMARY KEY ("id"), CONSTRAINT "UQ_customer_addresses_user_label" UNIQUE ("user_id", "label"), CONSTRAINT "FK_customer_addresses_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`
    );
    await q.query(
      `CREATE UNIQUE INDEX "UQ_customer_addresses_default" ON "customer_addresses" ("user_id") WHERE "is_default"`
    );
    await q.query(
      `CREATE TYPE "order_status" AS ENUM ('PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','PICKED_UP','DELIVERED','REJECTED','CANCELLED')`
    );
    await q.query(`CREATE TYPE "payment_method" AS ENUM ('COD')`);
    await q.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" varchar(12) NOT NULL, "customer_user_id" uuid NOT NULL, "store_id" uuid NOT NULL, "driver_user_id" uuid, "status" "order_status" NOT NULL, "payment_method" "payment_method" NOT NULL, "subtotal_vnd" integer NOT NULL, "delivery_fee_vnd" integer NOT NULL, "total_vnd" integer NOT NULL, "customer_phone" varchar(16) NOT NULL, "delivery_label" varchar(40) NOT NULL, "delivery_line" varchar(255) NOT NULL, "delivery_note" varchar(255), "customer_note" varchar(500), "idempotency_key" varchar(64) NOT NULL, "reject_reason" varchar(255), "placed_at" timestamptz NOT NULL DEFAULT now(), "accepted_at" timestamptz, "preparing_at" timestamptz, "ready_at" timestamptz, "assigned_at" timestamptz, "picked_up_at" timestamptz, "delivered_at" timestamptz, "closed_at" timestamptz, "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_orders" PRIMARY KEY ("id"), CONSTRAINT "UQ_orders_code" UNIQUE ("code"), CONSTRAINT "UQ_orders_customer_idempotency" UNIQUE ("customer_user_id", "idempotency_key"), CONSTRAINT "CHK_orders_amounts" CHECK ("subtotal_vnd" >= 0 AND "delivery_fee_vnd" >= 0 AND "total_vnd" = "subtotal_vnd" + "delivery_fee_vnd"), CONSTRAINT "CHK_orders_driver_stage" CHECK ("status" NOT IN ('PICKED_UP','DELIVERED') OR "driver_user_id" IS NOT NULL), CONSTRAINT "FK_orders_customer" FOREIGN KEY ("customer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT, CONSTRAINT "FK_orders_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT, CONSTRAINT "FK_orders_driver" FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`
    );
    await q.query(
      `CREATE INDEX "IDX_orders_customer_placed" ON "orders" ("customer_user_id", "placed_at")`
    );
    await q.query(
      `CREATE INDEX "IDX_orders_store_status" ON "orders" ("store_id", "status")`
    );
    await q.query(
      `CREATE INDEX "IDX_orders_driver_status" ON "orders" ("driver_user_id", "status")`
    );
    await q.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "order_id" uuid NOT NULL, "product_id" uuid, "product_name" varchar(120) NOT NULL, "image_url" varchar(500), "unit_price_vnd" integer NOT NULL, "quantity" integer NOT NULL, "line_total_vnd" integer NOT NULL, "options" jsonb NOT NULL DEFAULT '[]', "position" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_order_items" PRIMARY KEY ("id"), CONSTRAINT "CHK_order_items_quantity" CHECK ("quantity" BETWEEN 1 AND 20), CONSTRAINT "CHK_order_items_total" CHECK ("unit_price_vnd" >= 0 AND "line_total_vnd" = "unit_price_vnd" * "quantity"), CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE, CONSTRAINT "FK_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL)`
    );
    await q.query(
      `CREATE INDEX "IDX_order_items_order" ON "order_items" ("order_id")`
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "order_items"`);
    await q.query(`DROP TABLE "orders"`);
    await q.query(`DROP TYPE "payment_method"`);
    await q.query(`DROP TYPE "order_status"`);
    await q.query(`DROP TABLE "customer_addresses"`);
  }
}
