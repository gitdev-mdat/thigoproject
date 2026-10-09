import type { MigrationInterface, QueryRunner } from "typeorm";
export class CreateCatalog1760100000000 implements MigrationInterface {
  name = "CreateCatalog1760100000000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "store_category" AS ENUM ('FOOD','COFFEE','MILK_TEA')`
    );
    await q.query(
      `CREATE TABLE "stores" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "owner_user_id" uuid NOT NULL, "slug" varchar(80) NOT NULL, "name" varchar(120) NOT NULL, "description" text, "category" "store_category" NOT NULL, "address_line" varchar(255) NOT NULL, "cover_image_url" varchar(500), "is_active" boolean NOT NULL DEFAULT true, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_stores" PRIMARY KEY ("id"), CONSTRAINT "UQ_stores_owner" UNIQUE ("owner_user_id"), CONSTRAINT "UQ_stores_slug" UNIQUE ("slug"), CONSTRAINT "FK_stores_owner" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`
    );
    await q.query(
      `CREATE INDEX "IDX_stores_category_active" ON "stores" ("category", "is_active")`
    );
    await q.query(
      `CREATE TABLE "menu_categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "store_id" uuid NOT NULL, "name" varchar(80) NOT NULL, "position" integer NOT NULL DEFAULT 0, "is_active" boolean NOT NULL DEFAULT true, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_menu_categories" PRIMARY KEY ("id"), CONSTRAINT "UQ_menu_categories_store_name" UNIQUE ("store_id", "name"), CONSTRAINT "FK_menu_categories_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE)`
    );
    await q.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "store_id" uuid NOT NULL, "category_id" uuid NOT NULL, "name" varchar(120) NOT NULL, "description" text, "price_vnd" integer NOT NULL, "image_url" varchar(500), "is_available" boolean NOT NULL DEFAULT true, "position" integer NOT NULL DEFAULT 0, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_products" PRIMARY KEY ("id"), CONSTRAINT "UQ_products_store_name" UNIQUE ("store_id", "name"), CONSTRAINT "CHK_products_price" CHECK ("price_vnd" >= 0), CONSTRAINT "FK_products_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE, CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE RESTRICT)`
    );
    await q.query(
      `CREATE INDEX "IDX_products_category" ON "products" ("category_id")`
    );
    await q.query(
      `CREATE TABLE "product_option_groups" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "product_id" uuid NOT NULL, "name" varchar(80) NOT NULL, "min_select" integer NOT NULL DEFAULT 0, "max_select" integer NOT NULL DEFAULT 1, "position" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_product_option_groups" PRIMARY KEY ("id"), CONSTRAINT "UQ_product_option_groups_product_name" UNIQUE ("product_id", "name"), CONSTRAINT "CHK_product_option_groups_range" CHECK ("min_select" >= 0 AND "max_select" >= 1 AND "min_select" <= "max_select"), CONSTRAINT "FK_product_option_groups_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE)`
    );
    await q.query(
      `CREATE TABLE "product_options" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "group_id" uuid NOT NULL, "name" varchar(80) NOT NULL, "price_delta_vnd" integer NOT NULL DEFAULT 0, "is_available" boolean NOT NULL DEFAULT true, "position" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_product_options" PRIMARY KEY ("id"), CONSTRAINT "UQ_product_options_group_name" UNIQUE ("group_id", "name"), CONSTRAINT "CHK_product_options_price" CHECK ("price_delta_vnd" >= 0), CONSTRAINT "FK_product_options_group" FOREIGN KEY ("group_id") REFERENCES "product_option_groups"("id") ON DELETE CASCADE)`
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "product_options"`);
    await q.query(`DROP TABLE "product_option_groups"`);
    await q.query(`DROP TABLE "products"`);
    await q.query(`DROP TABLE "menu_categories"`);
    await q.query(`DROP TABLE "stores"`);
    await q.query(`DROP TYPE "store_category"`);
  }
}
