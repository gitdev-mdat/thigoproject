import "dotenv/config";

import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DataSource } from "typeorm";

import { createDatabaseOptions } from "../../config/database.js";
import { readDatabaseEnvironment } from "../../config/environment.js";
import { MenuCategory } from "../../entities/catalog/menu-category.entity.js";
import { ProductOptionGroup } from "../../entities/catalog/product-option-group.entity.js";
import { ProductOption } from "../../entities/catalog/product-option.entity.js";
import { Product } from "../../entities/catalog/product.entity.js";
import { Store } from "../../entities/catalog/store.entity.js";
import { DeliveryJob } from "../../entities/driver/delivery-job.entity.js";
import { EtaSource } from "../../entities/driver/delivery-offer.entity.js";
import { DeliveryOffer } from "../../entities/driver/delivery-offer.entity.js";
import { OrderItem } from "../../entities/ordering/order-item.entity.js";
import { Order } from "../../entities/ordering/order.entity.js";
import { DispatchRepository } from "./dispatch.repository.js";

const enabled = process.env.THIGO_POSTGRES_INTEGRATION === "true";
const postgres = enabled ? describe : describe.skip;

interface TestDriver {
  id: string;
  latitude: number;
  longitude: number;
}

interface TestJob {
  id: string;
  orderId: string;
  attempt: number;
  pickupLatitude: number;
  pickupLongitude: number;
}

postgres("DispatchRepository PostgreSQL concurrency", () => {
  let db: DataSource;
  let repository: DispatchRepository;
  let customerId: string;
  let storeId: string;
  let pickupLatitude: number;
  let pickupLongitude: number;
  const driverIds: string[] = [];
  const orderIds: string[] = [];

  beforeAll(async () => {
    const options = createDatabaseOptions(readDatabaseEnvironment(process.env));
    db = new DataSource({
      ...options,
      entities: [
        Store,
        MenuCategory,
        Product,
        ProductOptionGroup,
        ProductOption,
        Order,
        OrderItem,
        DeliveryJob,
        DeliveryOffer
      ],
      migrations: []
    });
    await db.initialize();
    repository = new DispatchRepository(db);
    const migrations = (await db.query(
      `SELECT count(*)::int AS count FROM thigo_migrations
       WHERE name IN ('DriverPresenceAndCoordinates1760600000000',
                      'DispatchOffersAndEarnings1760700000000')`
    )) as { count: number }[];
    if (migrations[0]?.count !== 2)
      throw new Error(
        "F06 migrations are not applied to the integration database."
      );
    const context = (await db.query(
      `SELECT u.id AS "customerId", s.id AS "storeId",
              s.pickup_latitude AS "pickupLatitude", s.pickup_longitude AS "pickupLongitude"
       FROM users u
       JOIN user_roles r ON r.user_id = u.id AND r.role = 'CUSTOMER'
       CROSS JOIN stores s
       WHERE s.pickup_latitude IS NOT NULL AND s.pickup_longitude IS NOT NULL
       ORDER BY s.id LIMIT 1`
    )) as {
      customerId: string;
      storeId: string;
      pickupLatitude: number;
      pickupLongitude: number;
    }[];
    if (!context[0]) throw new Error("Development fixtures are required.");
    customerId = context[0].customerId;
    storeId = context[0].storeId;
    pickupLatitude = Number(context[0].pickupLatitude);
    pickupLongitude = Number(context[0].pickupLongitude);
  });

  afterAll(async () => {
    if (!db?.isInitialized) return;
    if (orderIds.length) {
      await db.query(
        `DELETE FROM driver_earnings WHERE order_id = ANY($1::uuid[])`,
        [orderIds]
      );
      await db.query(`DELETE FROM orders WHERE id = ANY($1::uuid[])`, [
        orderIds
      ]);
    }
    if (driverIds.length)
      await db.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [
        driverIds
      ]);
    await db.destroy();
  });

  const createDriver = async (offset: number): Promise<TestDriver> => {
    const suffix = randomUUID().replaceAll("-", "").slice(0, 8);
    const users = (await db.query(
      `INSERT INTO users (phone) VALUES ($1) RETURNING id`,
      [`09${suffix}`]
    )) as { id: string }[];
    const id = users[0]!.id;
    driverIds.push(id);
    const latitude = pickupLatitude + offset * 0.001;
    const longitude = pickupLongitude + offset * 0.001;
    await db.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'DRIVER')`,
      [id]
    );
    await db.query(
      `INSERT INTO driver_profiles (user_id, display_name, vehicle_type, vehicle_plate)
       VALUES ($1, $2, 'MOTORBIKE', $3)`,
      [id, `Integration Driver ${offset}`, `TEST-${suffix}`]
    );
    await db.query(
      `INSERT INTO driver_presence (
         user_id, is_online, last_heartbeat_at, latitude, longitude,
         location_accuracy_meters, heading_degrees, speed_meters_per_second,
         location_recorded_at
       ) VALUES ($1, true, now(), $2, $3, 8, 90, 0, now())`,
      [id, latitude, longitude]
    );
    return { id, latitude, longitude };
  };

  const createJob = async (): Promise<TestJob> => {
    const token = randomUUID().replaceAll("-", "");
    const orders = (await db.query(
      `INSERT INTO orders (
         code, customer_user_id, store_id, status, payment_method,
         subtotal_vnd, delivery_fee_vnd, total_vnd, customer_phone,
         delivery_label, delivery_line, pickup_latitude, pickup_longitude,
         dropoff_latitude, dropoff_longitude, idempotency_key, ready_at
       ) VALUES ($1, $2, $3, 'READY_FOR_PICKUP', 'COD', 50000, 15000, 65000,
                 '0860000001', 'Test', 'Integration test only', $4, $5,
                 $6, $7, $8, now())
       RETURNING id`,
      [
        `TI${token.slice(0, 10)}`,
        customerId,
        storeId,
        pickupLatitude,
        pickupLongitude,
        pickupLatitude + 0.01,
        pickupLongitude + 0.01,
        `dispatch-integration-${token}`
      ]
    )) as { id: string }[];
    const orderId = orders[0]!.id;
    orderIds.push(orderId);
    const jobs = (await db.query(
      `INSERT INTO delivery_jobs (order_id, status, next_dispatch_at)
       VALUES ($1, 'PENDING', now()) RETURNING id`,
      [orderId]
    )) as { id: string }[];
    return {
      id: jobs[0]!.id,
      orderId,
      attempt: 0,
      pickupLatitude,
      pickupLongitude
    };
  };

  const createOffer = (
    job: TestJob,
    driver: TestDriver,
    expiresAt = new Date(Date.now() + 60_000)
  ) =>
    repository.createOffer(
      job,
      {
        driverUserId: driver.id,
        straightLineDistanceMeters: 200,
        pickupEtaSeconds: 120,
        etaSource: EtaSource.ESTIMATED
      },
      1,
      expiresAt
    );

  it("keeps offers, assignment, recovery, and earnings race-safe", async () => {
    const [driverA, driverB, driverC] = await Promise.all([
      createDriver(1),
      createDriver(2),
      createDriver(3)
    ]);

    const assignmentJob = await createJob();
    const assignmentOffer = await createOffer(assignmentJob, driverA);
    expect(assignmentOffer).toBeTruthy();
    const duplicateAccepts = await Promise.all([
      repository.acceptOffer(assignmentOffer!, driverA.id),
      repository.acceptOffer(assignmentOffer!, driverA.id),
      repository.acceptOffer(assignmentOffer!, driverB.id)
    ]);
    expect(
      duplicateAccepts.filter((result) => result.outcome === "accepted")
    ).toHaveLength(1);
    expect(
      duplicateAccepts.filter((result) => result.outcome === "already-accepted")
    ).toHaveLength(1);
    expect(duplicateAccepts).toContainEqual({ outcome: "not-found" });

    const assignment = (await db.query(
      `SELECT driver_user_id AS "driverUserId" FROM orders WHERE id = $1`,
      [assignmentJob.orderId]
    )) as { driverUserId: string }[];
    expect(assignment[0]!.driverUserId).toBe(driverA.id);

    const workerJob = await createJob();
    const competingOffers = await Promise.all([
      createOffer(workerJob, driverB),
      createOffer(workerJob, driverC)
    ]);
    expect(competingOffers.filter(Boolean)).toHaveLength(1);
    const pendingOffers = (await db.query(
      `SELECT id, driver_user_id AS "driverUserId" FROM delivery_offers
       WHERE job_id = $1 AND status = 'PENDING'`,
      [workerJob.id]
    )) as { id: string; driverUserId: string }[];
    expect(pendingOffers).toHaveLength(1);
    expect(
      await repository.rejectOffer(
        pendingOffers[0]!.id,
        pendingOffers[0]!.driverUserId
      )
    ).toMatchObject({ outcome: "rejected" });

    const capacityJobA = await createJob();
    const capacityJobB = await createJob();
    const capacityOfferA = await createOffer(capacityJobA, driverB);
    const capacityOfferB = await createOffer(capacityJobB, driverB);
    const capacityResults = await Promise.all([
      repository.acceptOffer(capacityOfferA!, driverB.id),
      repository.acceptOffer(capacityOfferB!, driverB.id)
    ]);
    expect(
      capacityResults.filter((result) => result.outcome === "accepted")
    ).toHaveLength(1);
    expect(
      capacityResults.filter((result) => result.outcome === "unavailable")
    ).toHaveLength(1);

    const candidateJob = await createJob();
    const candidates = await repository.candidates(
      candidateJob.id,
      { latitude: pickupLatitude, longitude: pickupLongitude },
      8,
      20
    );
    expect(
      candidates.some((candidate) => candidate.driverUserId === driverA.id)
    ).toBe(false);
    expect(
      candidates.some((candidate) => candidate.driverUserId === driverB.id)
    ).toBe(false);
    expect(
      candidates.some((candidate) => candidate.driverUserId === driverC.id)
    ).toBe(true);
    await db.query(
      `UPDATE driver_presence SET is_online = false WHERE user_id = $1`,
      [driverC.id]
    );
    expect(
      await repository.candidates(
        candidateJob.id,
        { latitude: pickupLatitude, longitude: pickupLongitude },
        8,
        20
      )
    ).toHaveLength(0);

    const expiredJob = await createJob();
    await db.query(
      `UPDATE driver_presence SET is_online = true, last_heartbeat_at = now(), location_recorded_at = now()
       WHERE user_id = $1`,
      [driverC.id]
    );
    const expiredOffer = await createOffer(expiredJob, driverC);
    await db.query(
      `UPDATE delivery_offers
       SET offered_at = now() - interval '2 minutes', expires_at = now() - interval '1 minute'
       WHERE id = $1`,
      [expiredOffer]
    );
    expect(await repository.acceptOffer(expiredOffer!, driverC.id)).toEqual({
      outcome: "expired"
    });

    const activeForB = capacityResults.find(
      (result) => result.outcome === "accepted"
    );
    if (!activeForB || !("orderId" in activeForB))
      throw new Error("Expected one accepted capacity offer.");
    await db.query(
      `UPDATE driver_presence SET last_heartbeat_at = now() - interval '10 minutes'
       WHERE user_id = $1`,
      [driverB.id]
    );
    expect(await repository.recoverStaleAssignments(300_000)).toBeGreaterThan(
      0
    );
    const released = (await db.query(
      `SELECT driver_user_id AS "driverUserId" FROM orders WHERE id = $1`,
      [activeForB.orderId]
    )) as { driverUserId: string | null }[];
    expect(released[0]!.driverUserId).toBeNull();

    await db.query(
      `UPDATE orders SET status = 'PICKED_UP', picked_up_at = now()
       WHERE id = $1`,
      [assignmentJob.orderId]
    );
    expect(
      await Promise.all([
        repository.completeDelivery(assignmentJob.orderId, driverA.id),
        repository.completeDelivery(assignmentJob.orderId, driverA.id)
      ])
    ).toEqual([true, true]);
    const earnings = (await db.query(
      `SELECT count(*)::int AS count, sum(amount_vnd)::int AS amount
       FROM driver_earnings WHERE order_id = $1`,
      [assignmentJob.orderId]
    )) as { count: number; amount: number }[];
    expect(earnings[0]).toEqual({ count: 1, amount: 15_000 });
  }, 30_000);

  it("handles 50 moving drivers and 10 concurrent orders", async () => {
    const drivers = await Promise.all(
      Array.from({ length: 50 }, (_, index) => createDriver(index + 1))
    );
    const jobs = await Promise.all(
      Array.from({ length: 10 }, () => createJob())
    );

    const candidateLatencies = await Promise.all(
      jobs.map(async (job) => {
        const startedAt = performance.now();
        const candidates = await repository.candidates(
          job.id,
          { latitude: pickupLatitude, longitude: pickupLongitude },
          8,
          20
        );
        expect(candidates).toHaveLength(20);
        return performance.now() - startedAt;
      })
    );

    const offers = await Promise.all(
      jobs.map((job, index) => createOffer(job, drivers[index]!))
    );
    expect(offers.every(Boolean)).toBe(true);
    const acceptanceStartedAt = performance.now();
    const accepted = await Promise.all(
      offers.map((offer, index) =>
        repository.acceptOffer(offer!, drivers[index]!.id)
      )
    );
    const acceptanceMs = performance.now() - acceptanceStartedAt;
    expect(accepted.every((result) => result.outcome === "accepted")).toBe(
      true
    );

    const gpsStartedAt = performance.now();
    await Promise.all(
      drivers.map((driver, index) =>
        db.query(
          `UPDATE driver_presence
           SET latitude = $2, longitude = $3, speed_meters_per_second = 8,
               last_heartbeat_at = now(), location_recorded_at = now()
           WHERE user_id = $1`,
          [
            driver.id,
            driver.latitude + index * 0.00001,
            driver.longitude + index * 0.00001
          ]
        )
      )
    );
    const gpsUpdateMs = performance.now() - gpsStartedAt;

    const offline = drivers.slice(40, 45);
    const disconnected = drivers.slice(45, 50);
    await db.query(
      `UPDATE driver_presence SET is_online = false
       WHERE user_id = ANY($1::uuid[])`,
      [offline.map((driver) => driver.id)]
    );
    await db.query(
      `UPDATE driver_presence
       SET last_heartbeat_at = now() - interval '10 minutes'
       WHERE user_id = ANY($1::uuid[])`,
      [disconnected.map((driver) => driver.id)]
    );
    const recoveryJob = await createJob();
    const remainingCandidates = await repository.candidates(
      recoveryJob.id,
      { latitude: pickupLatitude, longitude: pickupLongitude },
      8,
      50
    );
    const excludedIds = new Set(
      [...offline, ...disconnected].map((driver) => driver.id)
    );
    expect(
      remainingCandidates.every(
        (candidate) => !excludedIds.has(candidate.driverUserId)
      )
    ).toBe(true);

    const sortedCandidateLatencies = [...candidateLatencies].sort(
      (a, b) => a - b
    );
    const percentile = (ratio: number) =>
      sortedCandidateLatencies[
        Math.min(
          sortedCandidateLatencies.length - 1,
          Math.ceil(sortedCandidateLatencies.length * ratio) - 1
        )
      ]!;
    console.info(
      "dispatch-load",
      JSON.stringify({
        onlineDrivers: drivers.length,
        concurrentOrders: jobs.length,
        candidateQueryP50Ms: Number(percentile(0.5).toFixed(1)),
        candidateQueryP95Ms: Number(percentile(0.95).toFixed(1)),
        concurrentAcceptanceMs: Number(acceptanceMs.toFixed(1)),
        movingGpsUpdates: drivers.length,
        movingGpsUpdateBatchMs: Number(gpsUpdateMs.toFixed(1)),
        offlineOrDisconnectedExcluded: excludedIds.size
      })
    );
  }, 60_000);
});
