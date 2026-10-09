import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";
import type { StoreProfileInput } from "../../dto/merchant/storefront.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  MerchantApplication,
  MerchantApplicationSource,
  MerchantApplicationStatus as S
} from "../../entities/merchant/merchant-application.entity.js";
import { MerchantApplicationEvent } from "../../entities/merchant/merchant-application-event.entity.js";
import {
  APPLICATION_ACTIONS,
  applicationCode,
  type ApplicationAction
} from "../../common/merchant/application-lifecycle.js";
import { likePattern } from "../admin/admin.repository.js";

export interface ApplicationFields {
  storeName: string;
  category: StoreProfileInput["category"];
  contactPhone: string;
  addressLine: string;
  description: string | null;
  contactName: string;
}

export type DecisionResult =
  | { ok: true; application: MerchantApplication }
  | {
      ok: false;
      reason:
        | "not_found"
        | "wrong_status"
        | "self_decision"
        | "has_store"
        | "no_account"
        | "ineligible_account";
    };

export type CreateResult =
  | { ok: true; application: MerchantApplication }
  | {
      ok: false;
      reason: Exclude<DecisionResult, { ok: true }>["reason"] | "phone_taken";
    };

export interface EventRow {
  from_status: S | null;
  to_status: S;
  action: string;
  note: string | null;
  actor_user_id: string;
  actor_phone: string;
  actor_is_applicant: boolean;
  created_at: Date;
}

const UNIQUE_VIOLATION = "23505";
const constraintOf = (error: unknown) =>
  (error as { constraint?: string; driverError?: { constraint?: string } })
    ?.constraint ??
  (error as { driverError?: { constraint?: string } })?.driverError?.constraint;
const isUniqueViolation = (error: unknown) =>
  (error as { code?: string; driverError?: { code?: string } })?.code ===
    UNIQUE_VIOLATION ||
  (error as { driverError?: { code?: string } })?.driverError?.code ===
    UNIQUE_VIOLATION;

/** Persistence for merchant applications; every status change writes history. */
@Injectable()
export class MerchantApplicationRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  /** The application currently holding this phone, if any (not rejected). */
  findOpenByPhone(phone: string): Promise<MerchantApplication | null> {
    return this.db.getRepository(MerchantApplication).findOne({
      where: [
        { phone, status: S.DRAFT },
        { phone, status: S.PENDING_REVIEW },
        { phone, status: S.CHANGES_REQUESTED },
        { phone, status: S.APPROVED }
      ]
    });
  }

  findLatestByPhone(phone: string): Promise<MerchantApplication | null> {
    return this.db
      .getRepository(MerchantApplication)
      .findOne({ where: { phone }, order: { createdAt: "DESC" } });
  }

  findById(id: string): Promise<MerchantApplication | null> {
    return this.db.getRepository(MerchantApplication).findOneBy({ id });
  }

  async accountState(phone: string): Promise<{
    userId: string | null;
    roles: string[];
    storeId: string | null;
  }> {
    const [row] = (await this.db.query(
      `SELECT u.id,
              ARRAY(SELECT r.role::text FROM user_roles r WHERE r.user_id = u.id ORDER BY r.role) AS roles,
              (SELECT s.id FROM stores s WHERE s.owner_user_id = u.id) AS store_id
         FROM users u WHERE u.phone = $1`,
      [phone]
    )) as { id: string; roles: string[]; store_id: string | null }[];
    return row
      ? { userId: row.id, roles: row.roles, storeId: row.store_id }
      : { userId: null, roles: [], storeId: null };
  }

  async history(applicationId: string): Promise<EventRow[]> {
    return this.db.query(
      `SELECT e.from_status, e.to_status, e.action, e.note, e.actor_user_id,
              u.phone AS actor_phone,
              (e.actor_user_id = a.applicant_user_id) AS actor_is_applicant,
              e.created_at
         FROM merchant_application_events e
         JOIN merchant_applications a ON a.id = e.application_id
         JOIN users u ON u.id = e.actor_user_id
        WHERE e.application_id = $1
        ORDER BY e.created_at, e.id`,
      [applicationId]
    );
  }

  /**
   * Creates an application and its first history row. Returns null when the
   * phone already has an open application (the partial unique index decides).
   */
  async create(values: {
    phone: string;
    applicantUserId: string | null;
    source: MerchantApplicationSource;
    action: Extract<ApplicationAction, "CREATE_DRAFT" | "ADMIN_CREATE">;
    actorUserId: string;
    fields: ApplicationFields;
    /** Activate in the same transaction (Admin adding an existing account). */
    activate?: { userId: string; slug: string };
  }): Promise<CreateResult> {
    const status = APPLICATION_ACTIONS[values.action].to;
    const now = new Date();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.db.transaction(async (manager) => {
          const created = await manager.getRepository(MerchantApplication).save(
            manager.getRepository(MerchantApplication).create({
              code: applicationCode(),
              phone: values.phone,
              applicantUserId: values.applicantUserId,
              source: values.source,
              status,
              ...values.fields,
              reviewNote: null,
              submittedAt: values.action === "ADMIN_CREATE" ? now : null,
              decidedAt: values.action === "ADMIN_CREATE" ? now : null,
              decidedByUserId:
                values.action === "ADMIN_CREATE" ? values.actorUserId : null,
              activatedAt: null,
              storeId: null
            })
          );
          await this.event(
            manager,
            created.id,
            null,
            status,
            values.action,
            values.actorUserId,
            null
          );
          if (values.activate) {
            const activated = await this.activateLocked(
              manager,
              created.id,
              values.activate.userId,
              values.activate.slug,
              values.actorUserId
            );
            if (!activated.ok) throw new ActivationAborted(activated.reason);
            return { ok: true, application: activated.application } as const;
          }
          return { ok: true, application: created } as const;
        });
      } catch (error) {
        if (error instanceof ActivationAborted)
          return { ok: false, reason: error.reason };
        if (!isUniqueViolation(error)) throw error;
        // A taken code is retried; a taken phone means another open application.
        if (await this.findOpenByPhone(values.phone))
          return { ok: false, reason: "phone_taken" };
        if (constraintOf(error) !== "UQ_merchant_applications_code")
          return { ok: false, reason: "has_store" };
      }
    }
    return { ok: false, reason: "phone_taken" };
  }

  /** Edits the proposal while the applicant still owns the next step. */
  async updateFields(
    id: string,
    applicantUserId: string,
    fields: ApplicationFields
  ): Promise<MerchantApplication | null> {
    const result = await this.db
      .createQueryBuilder()
      .update(MerchantApplication)
      .set({ ...fields })
      .where(
        "id = :id AND applicant_user_id = :applicantUserId AND status IN (:...editable)",
        { id, applicantUserId, editable: [S.DRAFT, S.CHANGES_REQUESTED] }
      )
      .execute();
    return result.affected === 1 ? this.findById(id) : null;
  }

  /** The applicant sends (or resends) the application for review. */
  async submit(
    id: string,
    applicantUserId: string
  ): Promise<MerchantApplication | null> {
    return this.db.transaction(async (manager) => {
      const [row] = (await manager.query(
        `SELECT status FROM merchant_applications WHERE id = $1 AND applicant_user_id = $2 FOR UPDATE`,
        [id, applicantUserId]
      )) as { status: S }[];
      if (
        !row ||
        !(APPLICATION_ACTIONS.SUBMIT.from as readonly S[]).includes(row.status)
      )
        return null;
      await manager.query(
        `UPDATE merchant_applications SET status = $2, submitted_at = now(), review_note = NULL, updated_at = now() WHERE id = $1`,
        [id, S.PENDING_REVIEW]
      );
      await this.event(
        manager,
        id,
        row.status,
        S.PENDING_REVIEW,
        "SUBMIT",
        applicantUserId,
        null
      );
      return manager.getRepository(MerchantApplication).findOneByOrFail({ id });
    });
  }

  /**
   * An Admin decision. The row is locked, so concurrent or repeated decisions
   * see the status the first one wrote and fail with `wrong_status`. Approval
   * grants the role and creates the store in the same transaction.
   */
  async decide(
    id: string,
    action: Extract<
      ApplicationAction,
      "APPROVE" | "REQUEST_CHANGES" | "REJECT"
    >,
    adminUserId: string,
    note: string | null,
    slug: string
  ): Promise<DecisionResult> {
    try {
      return await this.db.transaction(async (manager) => {
        const [row] = (await manager.query(
          `SELECT status, applicant_user_id FROM merchant_applications WHERE id = $1 FOR UPDATE`,
          [id]
        )) as { status: S; applicant_user_id: string | null }[];
        if (!row) return { ok: false, reason: "not_found" } as const;
        if (
          !(APPLICATION_ACTIONS[action].from as readonly S[]).includes(
            row.status
          )
        )
          return { ok: false, reason: "wrong_status" } as const;
        if (row.applicant_user_id === adminUserId)
          return { ok: false, reason: "self_decision" } as const;
        const to = APPLICATION_ACTIONS[action].to;
        await manager.query(
          `UPDATE merchant_applications SET status = $2, review_note = $3, decided_at = now(), decided_by_user_id = $4, updated_at = now() WHERE id = $1`,
          [id, to, note, adminUserId]
        );
        await this.event(
          manager,
          id,
          row.status,
          to,
          action,
          adminUserId,
          note
        );
        if (action === "APPROVE" && row.applicant_user_id) {
          const activated = await this.activateLocked(
            manager,
            id,
            row.applicant_user_id,
            slug,
            adminUserId
          );
          if (!activated.ok) throw new ActivationAborted(activated.reason);
          return activated;
        }
        return {
          ok: true,
          application: await manager
            .getRepository(MerchantApplication)
            .findOneByOrFail({ id })
        } as const;
      });
    } catch (error) {
      if (error instanceof ActivationAborted)
        return { ok: false, reason: error.reason };
      throw error;
    }
  }

  /** The invited phone signs in and claims its approved application. */
  async activate(
    id: string,
    userId: string,
    slug: string
  ): Promise<DecisionResult> {
    try {
      return await this.db.transaction(async (manager) => {
        const result = await this.activateLocked(
          manager,
          id,
          userId,
          slug,
          userId
        );
        if (!result.ok) throw new ActivationAborted(result.reason);
        return result;
      });
    } catch (error) {
      if (error instanceof ActivationAborted)
        return { ok: false, reason: error.reason };
      throw error;
    }
  }

  /**
   * Grants MERCHANT and creates the hidden store from the application. Must
   * run inside a transaction; the application row is locked first.
   */
  private async activateLocked(
    manager: EntityManager,
    id: string,
    userId: string,
    slug: string,
    actorUserId: string
  ): Promise<DecisionResult> {
    const [row] = (await manager.query(
      `SELECT a.*, u.phone AS user_phone, u.is_active AS user_active,
              EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role = 'ADMIN') AS user_is_admin
         FROM merchant_applications a, users u
        WHERE a.id = $1 AND u.id = $2
        FOR UPDATE OF a`,
      [id, userId]
    )) as (Record<string, unknown> & { user_phone: string })[];
    if (!row) return { ok: false, reason: "not_found" };
    if (row.status !== S.APPROVED || row.activated_at)
      return { ok: false, reason: "wrong_status" };
    if (row.phone !== row.user_phone)
      return { ok: false, reason: "no_account" };
    // A suspended account or an Admin account is never turned into a merchant.
    if (!row.user_active || row.user_is_admin)
      return { ok: false, reason: "ineligible_account" };
    const [existing] = (await manager.query(
      `SELECT id FROM stores WHERE owner_user_id = $1`,
      [userId]
    )) as { id: string }[];
    if (existing) return { ok: false, reason: "has_store" };
    await manager.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, ApplicationRole.MERCHANT]
    );
    const [store] = (await manager.query(
      `INSERT INTO stores (owner_user_id, slug, name, description, category, address_line, phone, is_active, is_accepting_orders)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, true) RETURNING id`,
      [
        userId,
        slug,
        row.store_name,
        row.description,
        row.category,
        row.address_line,
        row.contact_phone
      ]
    )) as { id: string }[];
    await manager.query(
      `UPDATE merchant_applications SET applicant_user_id = $2, store_id = $3, activated_at = now(), updated_at = now() WHERE id = $1`,
      [id, userId, store!.id]
    );
    await this.event(
      manager,
      id,
      S.APPROVED,
      S.APPROVED,
      "ACTIVATE",
      actorUserId,
      null
    );
    return {
      ok: true,
      application: await manager
        .getRepository(MerchantApplication)
        .findOneByOrFail({ id })
    };
  }

  async list(query: {
    status?: S | undefined;
    q?: string | undefined;
    page: number;
    pageSize: number;
  }): Promise<{ rows: MerchantApplication[]; total: number }> {
    const builder = this.db
      .getRepository(MerchantApplication)
      .createQueryBuilder("a");
    if (query.status)
      builder.andWhere("a.status = :status", { status: query.status });
    if (query.q)
      builder.andWhere(
        "(a.store_name ILIKE :q OR a.code ILIKE :q OR a.phone ILIKE :q OR a.contact_name ILIKE :q)",
        { q: likePattern(query.q) }
      );
    const [rows, total] = await builder
      .orderBy(
        "CASE a.status WHEN 'PENDING_REVIEW' THEN 0 WHEN 'CHANGES_REQUESTED' THEN 1 WHEN 'DRAFT' THEN 2 ELSE 3 END"
      )
      .addOrderBy("a.updated_at", "DESC")
      .addOrderBy("a.id")
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
    return { rows, total };
  }

  async countsByStatus(): Promise<{ key: string; count: number }[]> {
    return this.db.query(
      `SELECT status::text AS key, COUNT(*)::int AS count FROM merchant_applications GROUP BY status`
    );
  }

  async storeSummary(
    storeId: string
  ): Promise<{ id: string; name: string; isPublished: boolean } | null> {
    const [row] = (await this.db.query(
      `SELECT id, name, is_active FROM stores WHERE id = $1`,
      [storeId]
    )) as { id: string; name: string; is_active: boolean }[];
    return row
      ? { id: row.id, name: row.name, isPublished: row.is_active }
      : null;
  }

  private async event(
    manager: EntityManager,
    applicationId: string,
    fromStatus: S | null,
    toStatus: S,
    action: ApplicationAction,
    actorUserId: string,
    note: string | null
  ) {
    // clock_timestamp(), not now(): steps in one transaction keep their order.
    await manager
      .createQueryBuilder()
      .insert()
      .into(MerchantApplicationEvent)
      .values({
        applicationId,
        fromStatus,
        toStatus,
        action,
        actorUserId,
        note,
        createdAt: () => "clock_timestamp()"
      })
      .execute();
  }
}

class ActivationAborted extends Error {
  constructor(
    readonly reason: Exclude<DecisionResult, { ok: true }>["reason"]
  ) {
    super(reason);
  }
}
