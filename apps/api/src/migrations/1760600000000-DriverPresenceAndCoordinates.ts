import type { MigrationInterface, QueryRunner } from "typeorm";

export class DriverPresenceAndCoordinates1760600000000 implements MigrationInterface {
  name = "DriverPresenceAndCoordinates1760600000000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "driver_vehicle_type" AS ENUM ('MOTORBIKE','BICYCLE','CAR')`
    );
    await q.query(
      `CREATE TABLE "driver_profiles" ("user_id" uuid NOT NULL, "display_name" varchar(100) NOT NULL, "vehicle_type" "driver_vehicle_type" NOT NULL, "vehicle_plate" varchar(20) NOT NULL, "last_assigned_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_driver_profiles" PRIMARY KEY ("user_id"), CONSTRAINT "FK_driver_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`
    );
    await q.query(
      `CREATE TABLE "driver_presence" ("user_id" uuid NOT NULL, "is_online" boolean NOT NULL DEFAULT false, "last_heartbeat_at" timestamptz, "latitude" double precision, "longitude" double precision, "location_accuracy_meters" real, "heading_degrees" real, "speed_meters_per_second" real, "location_recorded_at" timestamptz, "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_driver_presence" PRIMARY KEY ("user_id"), CONSTRAINT "CHK_driver_presence_coordinates" CHECK (("latitude" IS NULL) = ("longitude" IS NULL) AND ("latitude" IS NULL OR ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180))), CONSTRAINT "CHK_driver_presence_accuracy" CHECK ("location_accuracy_meters" IS NULL OR "location_accuracy_meters" > 0), CONSTRAINT "CHK_driver_presence_heading" CHECK ("heading_degrees" IS NULL OR "heading_degrees" BETWEEN 0 AND 360), CONSTRAINT "CHK_driver_presence_speed" CHECK ("speed_meters_per_second" IS NULL OR "speed_meters_per_second" >= 0), CONSTRAINT "FK_driver_presence_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`
    );
    await q.query(
      `ALTER TABLE "stores" ADD "pickup_latitude" double precision, ADD "pickup_longitude" double precision, ADD CONSTRAINT "CHK_stores_pickup_coordinates" CHECK (("pickup_latitude" IS NULL) = ("pickup_longitude" IS NULL) AND ("pickup_latitude" IS NULL OR ("pickup_latitude" BETWEEN -90 AND 90 AND "pickup_longitude" BETWEEN -180 AND 180)))`
    );
    await q.query(
      `ALTER TABLE "customer_addresses" ADD "latitude" double precision, ADD "longitude" double precision, ADD CONSTRAINT "CHK_customer_addresses_coordinates" CHECK (("latitude" IS NULL) = ("longitude" IS NULL) AND ("latitude" IS NULL OR ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)))`
    );
    await q.query(
      `ALTER TABLE "orders" ADD "pickup_latitude" double precision, ADD "pickup_longitude" double precision, ADD "dropoff_latitude" double precision, ADD "dropoff_longitude" double precision, ADD CONSTRAINT "CHK_orders_pickup_coordinates" CHECK (("pickup_latitude" IS NULL) = ("pickup_longitude" IS NULL) AND ("pickup_latitude" IS NULL OR ("pickup_latitude" BETWEEN -90 AND 90 AND "pickup_longitude" BETWEEN -180 AND 180))), ADD CONSTRAINT "CHK_orders_dropoff_coordinates" CHECK (("dropoff_latitude" IS NULL) = ("dropoff_longitude" IS NULL) AND ("dropoff_latitude" IS NULL OR ("dropoff_latitude" BETWEEN -90 AND 90 AND "dropoff_longitude" BETWEEN -180 AND 180)))`
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "CHK_orders_dropoff_coordinates", DROP CONSTRAINT "CHK_orders_pickup_coordinates", DROP COLUMN "dropoff_longitude", DROP COLUMN "dropoff_latitude", DROP COLUMN "pickup_longitude", DROP COLUMN "pickup_latitude"`
    );
    await q.query(
      `ALTER TABLE "customer_addresses" DROP CONSTRAINT "CHK_customer_addresses_coordinates", DROP COLUMN "longitude", DROP COLUMN "latitude"`
    );
    await q.query(
      `ALTER TABLE "stores" DROP CONSTRAINT "CHK_stores_pickup_coordinates", DROP COLUMN "pickup_longitude", DROP COLUMN "pickup_latitude"`
    );
    await q.query(`DROP TABLE "driver_presence"`);
    await q.query(`DROP TABLE "driver_profiles"`);
    await q.query(`DROP TYPE "driver_vehicle_type"`);
  }
}
