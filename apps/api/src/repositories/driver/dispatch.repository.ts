import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";

import {
  DeliveryJob,
  DeliveryJobStatus
} from "../../entities/driver/delivery-job.entity.js";
import {
  DeliveryOffer,
  DeliveryOfferStatus,
  type EtaSource
} from "../../entities/driver/delivery-offer.entity.js";
import { Order, OrderStatus } from "../../entities/ordering/order.entity.js";
import type { PickupEta } from "../../services/driver/routing.service.js";

export interface DispatchableJob {
  id: string;
  orderId: string;
  attempt: number;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
}

export interface DispatchCandidate {
  driverUserId: string;
  latitude: number;
  longitude: number;
  headingDegrees: number | null;
  lastAssignedAt: Date | null;
}

export type OfferDecision =
  | { outcome: "accepted" | "already-accepted"; orderId: string }
  | { outcome: "expired" }
  | { outcome: "unavailable" }
  | { outcome: "not-found" };

export interface DriverEarningsSummary {
  todayVnd: number;
  weekVnd: number;
  completedToday: number;
  completedWeek: number;
  recent: Record<string, unknown>[];
}

const ACTIVE_ORDER_SQL =
  "('ACCEPTED','PREPARING','READY_FOR_PICKUP','PICKED_UP')";

@Injectable()
export class DispatchRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  isReady(): boolean {
    return this.db.isInitialized;
  }

  async readyForDispatch(orderId: string, storeId: string): Promise<boolean> {
    return this.db.transaction(async (manager) => {
      const moved = await manager
        .createQueryBuilder()
        .update(Order)
        .set({ status: OrderStatus.READY_FOR_PICKUP, readyAt: () => "now()" })
        .where("id = :orderId AND store_id = :storeId AND status = :from", {
          orderId,
          storeId,
          from: OrderStatus.PREPARING
        })
        .execute();
      if (moved.affected !== 1) return false;
      const rows = (await manager.query(
        `INSERT INTO delivery_jobs (order_id, status, next_dispatch_at)
         VALUES ($1, 'PENDING', now())
         ON CONFLICT (order_id) DO UPDATE SET next_dispatch_at = LEAST(delivery_jobs.next_dispatch_at, now())
         RETURNING id`,
        [orderId]
      )) as { id: string }[];
      await this.event(manager, rows[0]!.id, orderId, null, "JOB_CREATED", {});
      return true;
    });
  }

  async ensureReadyJobs(): Promise<number> {
    return this.db.transaction(async (manager) => {
      const rows = (await manager.query(
        `INSERT INTO delivery_jobs (order_id, status, next_dispatch_at)
         SELECT o.id, 'PENDING', now() FROM orders o
         WHERE o.status = 'READY_FOR_PICKUP' AND o.driver_user_id IS NULL
         ON CONFLICT (order_id) DO NOTHING
         RETURNING id, order_id AS "orderId"`
      )) as { id: string; orderId: string }[];
      for (const row of rows)
        await this.event(
          manager,
          row.id,
          row.orderId,
          null,
          "JOB_RECOVERED",
          {}
        );
      return rows.length;
    });
  }

  async leaseDueJobs(
    limit: number,
    leaseMs: number
  ): Promise<DispatchableJob[]> {
    const ids = await this.db.transaction(async (manager) => {
      const expired = (await manager.query(
        `UPDATE delivery_offers SET status = 'EXPIRED', responded_at = now()
         WHERE status = 'PENDING' AND expires_at <= now()
         RETURNING job_id AS "jobId", id`
      )) as { jobId: string; id: string }[];
      for (const offer of expired)
        await manager.query(
          `UPDATE delivery_jobs SET status = 'PENDING', next_dispatch_at = now(), updated_at = now()
           WHERE id = $1 AND status = 'OFFERING'`,
          [offer.jobId]
        );
      const rows = (await manager.query(
        `SELECT j.id FROM delivery_jobs j
         JOIN orders o ON o.id = j.order_id
         WHERE j.status IN ('PENDING','OFFERING') AND j.next_dispatch_at <= now()
           AND o.status = 'READY_FOR_PICKUP' AND o.driver_user_id IS NULL
         ORDER BY j.next_dispatch_at, j.created_at
         FOR UPDATE OF j SKIP LOCKED LIMIT $1`,
        [limit]
      )) as { id: string }[];
      if (rows.length)
        await manager.query(
          `UPDATE delivery_jobs SET status = 'OFFERING', next_dispatch_at = now() + ($2 * interval '1 millisecond'), updated_at = now()
           WHERE id = ANY($1::uuid[])`,
          [rows.map((row) => row.id), leaseMs]
        );
      return rows.map((row) => row.id);
    });
    if (!ids.length) return [];
    const rows = (await this.db.query(
      `SELECT j.id, j.order_id AS "orderId", j.attempt,
              o.pickup_latitude AS "pickupLatitude", o.pickup_longitude AS "pickupLongitude"
       FROM delivery_jobs j JOIN orders o ON o.id = j.order_id
       WHERE j.id = ANY($1::uuid[])`,
      [ids]
    )) as DispatchableJob[];
    return rows.map((row) => ({
      ...row,
      attempt: Number(row.attempt),
      pickupLatitude:
        row.pickupLatitude === null ? null : Number(row.pickupLatitude),
      pickupLongitude:
        row.pickupLongitude === null ? null : Number(row.pickupLongitude)
    }));
  }

  async candidates(
    jobId: string,
    pickup: { latitude: number; longitude: number },
    radiusKm: number,
    limit: number
  ): Promise<DispatchCandidate[]> {
    const latitudeDelta = radiusKm / 111;
    const longitudeDelta =
      radiusKm / Math.max(111 * Math.cos((pickup.latitude * Math.PI) / 180), 1);
    const rows = (await this.db.query(
      `SELECT p.user_id AS "driverUserId", p.latitude, p.longitude,
              p.heading_degrees AS "headingDegrees", d.last_assigned_at AS "lastAssignedAt"
       FROM driver_presence p
       JOIN driver_profiles d ON d.user_id = p.user_id
       JOIN users u ON u.id = p.user_id AND u.is_active
       JOIN user_roles r ON r.user_id = p.user_id AND r.role = 'DRIVER'
       WHERE p.is_online
         AND p.last_heartbeat_at > now() - interval '45 seconds'
         AND p.location_recorded_at > now() - interval '120 seconds'
         AND p.location_accuracy_meters <= 100
         AND p.latitude BETWEEN $2 AND $3 AND p.longitude BETWEEN $4 AND $5
         AND NOT EXISTS (
           SELECT 1 FROM orders active
           WHERE active.driver_user_id = p.user_id AND active.status IN ${ACTIVE_ORDER_SQL}
         )
         AND NOT EXISTS (
           SELECT 1 FROM delivery_offers seen
           WHERE seen.job_id = $1 AND seen.driver_user_id = p.user_id
         )
       ORDER BY p.location_recorded_at DESC, p.user_id
       LIMIT $6`,
      [
        jobId,
        pickup.latitude - latitudeDelta,
        pickup.latitude + latitudeDelta,
        pickup.longitude - longitudeDelta,
        pickup.longitude + longitudeDelta,
        limit
      ]
    )) as DispatchCandidate[];
    return rows.map((row) => ({
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      headingDegrees:
        row.headingDegrees === null ? null : Number(row.headingDegrees),
      lastAssignedAt: row.lastAssignedAt ? new Date(row.lastAssignedAt) : null
    }));
  }

  async createOffer(
    job: DispatchableJob,
    eta: PickupEta,
    rank: number,
    expiresAt: Date
  ): Promise<string | null> {
    return this.db.transaction(async (manager) => {
      const locked = (await manager.query(
        `SELECT id, order_id AS "orderId" FROM delivery_jobs
         WHERE id = $1 AND status IN ('PENDING','OFFERING') AND assigned_driver_user_id IS NULL
         FOR UPDATE`,
        [job.id]
      )) as { id: string; orderId: string }[];
      if (!locked[0]) return null;
      const pending = await manager.getRepository(DeliveryOffer).exists({
        where: { jobId: job.id, status: DeliveryOfferStatus.PENDING }
      });
      if (pending) return null;
      try {
        const offer = await manager.getRepository(DeliveryOffer).save(
          manager.getRepository(DeliveryOffer).create({
            jobId: job.id,
            driverUserId: eta.driverUserId,
            status: DeliveryOfferStatus.PENDING,
            rank,
            straightLineDistanceMeters: eta.straightLineDistanceMeters,
            pickupEtaSeconds: eta.pickupEtaSeconds,
            etaSource: eta.etaSource,
            expiresAt,
            respondedAt: null
          })
        );
        await manager.getRepository(DeliveryJob).update(
          { id: job.id },
          {
            status: DeliveryJobStatus.OFFERING,
            attempt: () => "attempt + 1",
            nextDispatchAt: expiresAt
          }
        );
        await this.event(
          manager,
          job.id,
          job.orderId,
          eta.driverUserId,
          "OFFER_CREATED",
          {
            offerId: offer.id,
            rank,
            pickupEtaSeconds: eta.pickupEtaSeconds,
            etaSource: eta.etaSource
          }
        );
        return offer.id;
      } catch (error) {
        if ((error as { code?: string }).code === "23505") return null;
        throw error;
      }
    });
  }

  async deferOrExhaust(
    job: DispatchableJob,
    reason: string,
    maxAttempts: number,
    retryMs: number
  ): Promise<void> {
    await this.db.transaction(async (manager) => {
      const exhausted = job.attempt + 1 >= maxAttempts;
      await manager.getRepository(DeliveryJob).update(
        { id: job.id },
        {
          status: exhausted
            ? DeliveryJobStatus.EXHAUSTED
            : DeliveryJobStatus.PENDING,
          attempt: () => "attempt + 1",
          nextDispatchAt: () =>
            exhausted
              ? "next_dispatch_at"
              : `now() + (${retryMs} * interval '1 millisecond')`
        }
      );
      await this.event(
        manager,
        job.id,
        job.orderId,
        null,
        exhausted ? "DISPATCH_EXHAUSTED" : "DISPATCH_DEFERRED",
        { reason, attempt: job.attempt + 1 }
      );
    });
  }

  async currentOffer(driverUserId: string) {
    const rows = (await this.db.query(
      `SELECT o.id, o.job_id AS "jobId", j.order_id AS "orderId", o.expires_at AS "expiresAt",
              o.straight_line_distance_meters AS "straightLineDistanceMeters",
              o.pickup_eta_seconds AS "pickupEtaSeconds", o.eta_source AS "etaSource"
       FROM delivery_offers o JOIN delivery_jobs j ON j.id = o.job_id
       WHERE o.driver_user_id = $1 AND o.status = 'PENDING' AND o.expires_at > now()
       ORDER BY o.offered_at LIMIT 1`,
      [driverUserId]
    )) as {
      id: string;
      jobId: string;
      orderId: string;
      expiresAt: Date;
      straightLineDistanceMeters: number;
      pickupEtaSeconds: number;
      etaSource: EtaSource;
    }[];
    const row = rows[0];
    return row
      ? {
          ...row,
          expiresAt: new Date(row.expiresAt),
          straightLineDistanceMeters: Number(row.straightLineDistanceMeters),
          pickupEtaSeconds: Number(row.pickupEtaSeconds)
        }
      : null;
  }

  async acceptOffer(
    offerId: string,
    driverUserId: string
  ): Promise<OfferDecision> {
    try {
      return await this.db.transaction(async (manager) => {
        const rows = (await manager.query(
          `SELECT o.id, o.status, o.expires_at AS "expiresAt", j.id AS "jobId",
                  j.order_id AS "orderId", j.assigned_driver_user_id AS "assignedDriverUserId"
           FROM delivery_offers o JOIN delivery_jobs j ON j.id = o.job_id
           WHERE o.id = $1 AND o.driver_user_id = $2
           FOR UPDATE OF o, j`,
          [offerId, driverUserId]
        )) as {
          id: string;
          status: DeliveryOfferStatus;
          expiresAt: Date;
          jobId: string;
          orderId: string;
          assignedDriverUserId: string | null;
        }[];
        const offer = rows[0];
        if (!offer) return { outcome: "not-found" } as const;
        if (
          offer.status === DeliveryOfferStatus.ACCEPTED &&
          offer.assignedDriverUserId === driverUserId
        )
          return {
            outcome: "already-accepted",
            orderId: offer.orderId
          } as const;
        if (
          offer.status !== DeliveryOfferStatus.PENDING ||
          new Date(offer.expiresAt) <= new Date()
        ) {
          if (offer.status === DeliveryOfferStatus.PENDING)
            await manager.getRepository(DeliveryOffer).update(
              { id: offer.id },
              {
                status: DeliveryOfferStatus.EXPIRED,
                respondedAt: () => "now()"
              }
            );
          return { outcome: "expired" } as const;
        }
        const eligible = (await manager.query(
          `SELECT 1 FROM driver_presence p JOIN driver_profiles d ON d.user_id = p.user_id
           WHERE p.user_id = $1 AND p.is_online
             AND p.last_heartbeat_at > now() - interval '45 seconds'
             AND p.location_recorded_at > now() - interval '120 seconds'
             AND p.location_accuracy_meters <= 100
             AND NOT EXISTS (SELECT 1 FROM orders active WHERE active.driver_user_id = $1 AND active.status IN ${ACTIVE_ORDER_SQL})`,
          [driverUserId]
        )) as unknown[];
        if (!eligible.length) return { outcome: "unavailable" } as const;
        const assigned = await manager
          .createQueryBuilder()
          .update(Order)
          .set({ driverUserId, assignedAt: () => "now()" })
          .where(
            "id = :orderId AND status = :status AND driver_user_id IS NULL",
            { orderId: offer.orderId, status: OrderStatus.READY_FOR_PICKUP }
          )
          .execute();
        if (assigned.affected !== 1) return { outcome: "unavailable" } as const;
        await manager
          .getRepository(DeliveryOffer)
          .update(
            { id: offer.id },
            { status: DeliveryOfferStatus.ACCEPTED, respondedAt: () => "now()" }
          );
        await manager.getRepository(DeliveryJob).update(
          { id: offer.jobId },
          {
            status: DeliveryJobStatus.ASSIGNED,
            assignedDriverUserId: driverUserId
          }
        );
        await manager.query(
          `UPDATE driver_profiles SET last_assigned_at = now(), updated_at = now() WHERE user_id = $1`,
          [driverUserId]
        );
        await this.event(
          manager,
          offer.jobId,
          offer.orderId,
          driverUserId,
          "OFFER_ACCEPTED",
          { offerId }
        );
        return { outcome: "accepted", orderId: offer.orderId } as const;
      });
    } catch (error) {
      if ((error as { code?: string }).code === "23505")
        return { outcome: "unavailable" };
      throw error;
    }
  }

  async rejectOffer(
    offerId: string,
    driverUserId: string
  ): Promise<{
    outcome: "rejected" | "already-rejected" | "expired" | "not-found";
    orderId?: string;
  }> {
    return this.db.transaction(async (manager) => {
      const rows = (await manager.query(
        `SELECT o.id, o.status, o.expires_at AS "expiresAt", j.id AS "jobId", j.order_id AS "orderId"
         FROM delivery_offers o JOIN delivery_jobs j ON j.id = o.job_id
         WHERE o.id = $1 AND o.driver_user_id = $2 FOR UPDATE OF o, j`,
        [offerId, driverUserId]
      )) as {
        id: string;
        status: DeliveryOfferStatus;
        expiresAt: Date;
        jobId: string;
        orderId: string;
      }[];
      const offer = rows[0];
      if (!offer) return { outcome: "not-found" };
      if (offer.status === DeliveryOfferStatus.REJECTED)
        return { outcome: "already-rejected", orderId: offer.orderId };
      if (
        offer.status !== DeliveryOfferStatus.PENDING ||
        new Date(offer.expiresAt) <= new Date()
      )
        return { outcome: "expired", orderId: offer.orderId };
      await manager
        .getRepository(DeliveryOffer)
        .update(
          { id: offer.id },
          { status: DeliveryOfferStatus.REJECTED, respondedAt: () => "now()" }
        );
      await manager
        .getRepository(DeliveryJob)
        .update(
          { id: offer.jobId },
          { status: DeliveryJobStatus.PENDING, nextDispatchAt: () => "now()" }
        );
      await this.event(
        manager,
        offer.jobId,
        offer.orderId,
        driverUserId,
        "OFFER_REJECTED",
        { offerId }
      );
      return { outcome: "rejected", orderId: offer.orderId };
    });
  }

  async completeDelivery(
    orderId: string,
    driverUserId: string
  ): Promise<boolean> {
    return this.db.transaction(async (manager) => {
      const rows = (await manager.query(
        `SELECT id, status, delivery_fee_vnd AS "deliveryFeeVnd"
         FROM orders WHERE id = $1 AND driver_user_id = $2 FOR UPDATE`,
        [orderId, driverUserId]
      )) as { id: string; status: OrderStatus; deliveryFeeVnd: number }[];
      const order = rows[0];
      if (!order) return false;
      if (order.status === OrderStatus.DELIVERED) return true;
      if (order.status !== OrderStatus.PICKED_UP) return false;
      await manager
        .getRepository(Order)
        .update(
          { id: orderId, driverUserId },
          { status: OrderStatus.DELIVERED, deliveredAt: () => "now()" }
        );
      const jobs = (await manager.query(
        `UPDATE delivery_jobs SET status = 'COMPLETED', completed_at = now(), updated_at = now()
         WHERE order_id = $1 RETURNING id`,
        [orderId]
      )) as { id: string }[];
      await manager.query(
        `INSERT INTO driver_earnings (order_id, driver_user_id, amount_vnd, source)
         VALUES ($1, $2, $3, 'DELIVERY_FEE') ON CONFLICT (order_id) DO NOTHING`,
        [orderId, driverUserId, Number(order.deliveryFeeVnd)]
      );
      await this.event(
        manager,
        jobs[0]?.id ?? null,
        orderId,
        driverUserId,
        "DELIVERY_COMPLETED",
        { earningVnd: Number(order.deliveryFeeVnd) }
      );
      return true;
    });
  }

  async cancelAssignment(
    orderId: string,
    driverUserId: string
  ): Promise<boolean> {
    return this.db.transaction(async (manager) => {
      const rows = (await manager.query(
        `SELECT o.id, j.id AS "jobId" FROM orders o JOIN delivery_jobs j ON j.order_id = o.id
         WHERE o.id = $1 AND o.driver_user_id = $2 AND o.status = 'READY_FOR_PICKUP'
         FOR UPDATE OF o, j`,
        [orderId, driverUserId]
      )) as { id: string; jobId: string }[];
      const row = rows[0];
      if (!row) return false;
      await manager.query(
        `UPDATE orders SET driver_user_id = NULL, assigned_at = NULL, updated_at = now() WHERE id = $1`,
        [orderId]
      );
      await manager.query(
        `UPDATE delivery_jobs SET status = 'PENDING', assigned_driver_user_id = NULL, next_dispatch_at = now(), updated_at = now() WHERE id = $1`,
        [row.jobId]
      );
      await this.event(
        manager,
        row.jobId,
        orderId,
        driverUserId,
        "DRIVER_CANCELLED",
        {}
      );
      return true;
    });
  }

  async recoverStaleAssignments(graceMs: number): Promise<number> {
    return this.db.transaction(async (manager) => {
      const rows = (await manager.query(
        `SELECT o.id AS "orderId", o.driver_user_id AS "driverUserId", j.id AS "jobId"
         FROM orders o JOIN delivery_jobs j ON j.order_id = o.id
         LEFT JOIN driver_presence p ON p.user_id = o.driver_user_id
         WHERE o.status = 'READY_FOR_PICKUP' AND o.driver_user_id IS NOT NULL
           AND j.status = 'ASSIGNED'
           AND (p.is_online IS NOT TRUE OR p.last_heartbeat_at < now() - ($1 * interval '1 millisecond'))
         FOR UPDATE OF o, j SKIP LOCKED LIMIT 5`,
        [graceMs]
      )) as { orderId: string; driverUserId: string; jobId: string }[];
      for (const row of rows) {
        await manager.query(
          `UPDATE orders SET driver_user_id = NULL, assigned_at = NULL, updated_at = now() WHERE id = $1`,
          [row.orderId]
        );
        await manager.query(
          `UPDATE delivery_jobs SET status = 'PENDING', assigned_driver_user_id = NULL, next_dispatch_at = now(), updated_at = now() WHERE id = $1`,
          [row.jobId]
        );
        await this.event(
          manager,
          row.jobId,
          row.orderId,
          row.driverUserId,
          "STALE_ASSIGNMENT_RELEASED",
          { graceMs }
        );
      }
      return rows.length;
    });
  }

  async earnings(driverUserId: string): Promise<DriverEarningsSummary> {
    const summaries = (await this.db.query(
      `SELECT
         COALESCE(SUM(amount_vnd) FILTER (WHERE earned_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'), 0)::int AS "todayVnd",
         COALESCE(SUM(amount_vnd) FILTER (WHERE earned_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'), 0)::int AS "weekVnd",
         COUNT(*) FILTER (WHERE earned_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh')::int AS "completedToday",
         COUNT(*) FILTER (WHERE earned_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh')::int AS "completedWeek"
       FROM driver_earnings WHERE driver_user_id = $1`,
      [driverUserId]
    )) as Record<string, number>[];
    const recent = (await this.db.query(
      `SELECT e.order_id AS "orderId", o.code AS "orderCode", s.name AS "storeName",
              e.amount_vnd AS "amountVnd", e.earned_at AS "earnedAt"
       FROM driver_earnings e JOIN orders o ON o.id = e.order_id
       JOIN stores s ON s.id = o.store_id
       WHERE e.driver_user_id = $1 ORDER BY e.earned_at DESC LIMIT 20`,
      [driverUserId]
    )) as Record<string, unknown>[];
    return {
      todayVnd: Number(summaries[0]?.todayVnd ?? 0),
      weekVnd: Number(summaries[0]?.weekVnd ?? 0),
      completedToday: Number(summaries[0]?.completedToday ?? 0),
      completedWeek: Number(summaries[0]?.completedWeek ?? 0),
      recent
    };
  }

  private event(
    manager: EntityManager,
    jobId: string | null,
    orderId: string,
    driverUserId: string | null,
    type: string,
    details: Record<string, unknown>
  ) {
    return manager.query(
      `INSERT INTO delivery_events (job_id, order_id, driver_user_id, type, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [jobId, orderId, driverUserId, type, JSON.stringify(details)]
    );
  }
}
