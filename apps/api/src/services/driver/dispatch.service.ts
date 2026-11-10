import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit
} from "@nestjs/common";

import { haversineMeters } from "../../common/location/geo.js";
import { isUuid } from "../../dto/ordering/ordering.dto.js";
import type {
  DeliveryOfferDto,
  DriverEarningsDto
} from "../../dto/driver/dispatch.dto.js";
import {
  DispatchRepository,
  type DispatchCandidate,
  type DispatchableJob
} from "../../repositories/driver/dispatch.repository.js";
import { OrderRepository } from "../../repositories/ordering/order.repository.js";
import { toDelivery } from "../ordering/order-mapper.js";
import { RoutingService, type PickupEta } from "./routing.service.js";

const WORKER_INTERVAL_MS = 2_000;
const JOB_LEASE_MS = 8_000;
const OFFER_TTL_MS = 30_000;
const STALE_ASSIGNMENT_GRACE_MS = 5 * 60_000;
const RETRY_MS = 15_000;
const MAX_ATTEMPTS = 10;
const MAX_RADIUS_METERS = 8_000;
const DATABASE_CANDIDATE_LIMIT = 20;
const ROUTING_CANDIDATE_LIMIT = 10;

export interface RankedCandidate extends DispatchCandidate, PickupEta {}

export function rankDispatchCandidates(
  candidates: DispatchCandidate[],
  estimates: PickupEta[],
  pickup: { latitude: number; longitude: number }
): RankedCandidate[] {
  const byDriver = new Map(estimates.map((eta) => [eta.driverUserId, eta]));
  return candidates
    .map((candidate) => {
      const estimate = byDriver.get(candidate.driverUserId);
      if (!estimate) return null;
      const exactDistance = haversineMeters(candidate, pickup);
      if (exactDistance > MAX_RADIUS_METERS) return null;
      return {
        ...candidate,
        ...estimate,
        straightLineDistanceMeters: Math.round(exactDistance)
      };
    })
    .filter((item): item is RankedCandidate => item !== null)
    .sort(
      (a, b) =>
        a.pickupEtaSeconds - b.pickupEtaSeconds ||
        (a.lastAssignedAt?.getTime() ?? 0) -
          (b.lastAssignedAt?.getTime() ?? 0) ||
        a.driverUserId.localeCompare(b.driverUserId)
    );
}

@Injectable()
export class DispatchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DispatchService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private lastFailureLogAt = 0;

  constructor(
    private readonly dispatch: DispatchRepository,
    private readonly orders: OrderRepository,
    private readonly routing: RoutingService
  ) {}

  onModuleInit() {
    if (process.env.DISPATCH_WORKER_ENABLED === "false") return;
    this.timer = setInterval(() => void this.runTick(), WORKER_INTERVAL_MS);
    this.timer.unref?.();
    void this.runTick();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    if (this.running || !this.dispatch.isReady()) return;
    this.running = true;
    try {
      await this.dispatch.ensureReadyJobs();
      await this.dispatch.recoverStaleAssignments(STALE_ASSIGNMENT_GRACE_MS);
      const jobs = await this.dispatch.leaseDueJobs(5, JOB_LEASE_MS);
      for (const job of jobs) await this.process(job);
    } finally {
      this.running = false;
    }
  }

  private async runTick(): Promise<void> {
    try {
      await this.tick();
    } catch (error) {
      const now = Date.now();
      if (now - this.lastFailureLogAt >= 30_000) {
        this.lastFailureLogAt = now;
        this.logger.warn(
          `Dispatch cycle failed and will retry: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private async process(job: DispatchableJob): Promise<void> {
    if (job.pickupLatitude === null || job.pickupLongitude === null) {
      await this.dispatch.deferOrExhaust(
        job,
        "MISSING_PICKUP_COORDINATES",
        1,
        RETRY_MS
      );
      return;
    }
    const pickup = {
      latitude: job.pickupLatitude,
      longitude: job.pickupLongitude
    };
    const candidates = await this.dispatch.candidates(
      job.id,
      pickup,
      MAX_RADIUS_METERS / 1_000,
      DATABASE_CANDIDATE_LIMIT
    );
    const nearby = candidates
      .filter(
        (candidate) => haversineMeters(candidate, pickup) <= MAX_RADIUS_METERS
      )
      .slice(0, ROUTING_CANDIDATE_LIMIT);
    if (!nearby.length) {
      await this.dispatch.deferOrExhaust(
        job,
        "NO_ELIGIBLE_DRIVER",
        MAX_ATTEMPTS,
        RETRY_MS
      );
      return;
    }
    const estimates = await this.routing.pickupEtas(nearby, pickup);
    const ranked = rankDispatchCandidates(nearby, estimates, pickup);
    const best = ranked[0];
    if (!best) {
      await this.dispatch.deferOrExhaust(
        job,
        "ROUTING_UNAVAILABLE",
        MAX_ATTEMPTS,
        RETRY_MS
      );
      return;
    }
    await this.dispatch.createOffer(
      job,
      best,
      1,
      new Date(Date.now() + OFFER_TTL_MS)
    );
  }

  async currentOffer(driverUserId: string): Promise<DeliveryOfferDto | null> {
    const offer = await this.dispatch.currentOffer(driverUserId);
    if (!offer) return null;
    const order = await this.orders.findById(offer.orderId);
    if (!order) return null;
    return {
      id: offer.id,
      expiresAt: offer.expiresAt.toISOString(),
      straightLineDistanceMeters: offer.straightLineDistanceMeters,
      pickupEtaSeconds: offer.pickupEtaSeconds,
      etaSource: offer.etaSource,
      delivery: toDelivery(order, false)
    };
  }

  async accept(driverUserId: string, offerId: string) {
    if (!isUuid(offerId))
      throw new NotFoundException("Không tìm thấy đề nghị.");
    const decision = await this.dispatch.acceptOffer(offerId, driverUserId);
    if (decision.outcome === "not-found")
      throw new NotFoundException("Không tìm thấy đề nghị.");
    if (decision.outcome === "expired")
      throw new ConflictException("Đề nghị đã hết hạn.");
    if (decision.outcome === "unavailable")
      throw new ConflictException(
        "Đề nghị không còn khả dụng hoặc bạn đang có đơn khác."
      );
    const order = await this.orders.findForDriver(
      decision.orderId,
      driverUserId
    );
    if (!order) throw new ConflictException("Chưa thể nhận đơn.");
    return toDelivery(order, true);
  }

  async reject(driverUserId: string, offerId: string) {
    if (!isUuid(offerId))
      throw new NotFoundException("Không tìm thấy đề nghị.");
    const result = await this.dispatch.rejectOffer(offerId, driverUserId);
    if (result.outcome === "not-found")
      throw new NotFoundException("Không tìm thấy đề nghị.");
    if (result.outcome === "expired")
      throw new ConflictException("Đề nghị đã hết hạn.");
    return { rejected: true };
  }

  async earnings(driverUserId: string): Promise<DriverEarningsDto> {
    const value = await this.dispatch.earnings(driverUserId);
    return {
      todayVnd: Number(value.todayVnd ?? 0),
      weekVnd: Number(value.weekVnd ?? 0),
      completedToday: Number(value.completedToday ?? 0),
      completedWeek: Number(value.completedWeek ?? 0),
      recent: (
        value.recent as {
          orderId: string;
          orderCode: string;
          storeName: string;
          amountVnd: number;
          earnedAt: Date;
        }[]
      ).map((item) => ({
        ...item,
        amountVnd: Number(item.amountVnd),
        earnedAt: new Date(item.earnedAt).toISOString()
      }))
    };
  }
}
