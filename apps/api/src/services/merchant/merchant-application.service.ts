import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  EDITABLE_STATUSES,
  canTransition
} from "../../common/merchant/application-lifecycle.js";
import type {
  AdminApplicationDetailDto,
  AdminApplicationInput,
  ApplicationDto,
  ApplicationEventDto,
  ApplicationInput,
  MyApplicationDto
} from "../../dto/merchant/application.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import {
  MerchantApplicationSource,
  MerchantApplicationStatus as S,
  type MerchantApplication
} from "../../entities/merchant/merchant-application.entity.js";
import type { AuthenticatedUser } from "../../guards/role.guard.js";
import {
  MerchantApplicationRepository,
  type ApplicationFields,
  type CreateResult,
  type DecisionResult,
  type EventRow
} from "../../repositories/merchant/merchant-application.repository.js";
import { isUuid } from "../../dto/merchant/storefront.dto.js";
import { storeSlug } from "./storefront.service.js";

const iso = (value: Date | null) => (value ? value.toISOString() : null);

export function toApplicationDto(app: MerchantApplication): ApplicationDto {
  return {
    id: app.id,
    code: app.code,
    status: app.status,
    source: app.source,
    accountPhone: app.phone,
    storeName: app.storeName,
    category: app.category,
    contactPhone: app.contactPhone,
    addressLine: app.addressLine,
    description: app.description,
    contactName: app.contactName,
    reviewNote: app.reviewNote,
    submittedAt: iso(app.submittedAt),
    decidedAt: iso(app.decidedAt),
    activatedAt: iso(app.activatedAt),
    storeId: app.storeId,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString()
  };
}

function toEvent(row: EventRow, forAdmin: boolean): ApplicationEventDto {
  const adminAction = !row.actor_is_applicant;
  return {
    fromStatus: row.from_status,
    toStatus: row.to_status,
    action: row.action,
    note: row.note,
    actorKind: adminAction ? "admin" : "applicant",
    ...(forAdmin ? { actorPhone: row.actor_phone } : {}),
    createdAt: new Date(row.created_at).toISOString()
  };
}

function fieldsOf(input: ApplicationInput): ApplicationFields {
  return {
    storeName: input.store.name,
    category: input.store.category,
    contactPhone: input.store.phone,
    addressLine: input.store.addressLine,
    description: input.store.description,
    contactName: input.contactName
  };
}

const DECISION_MESSAGES: Record<
  Exclude<CreateResult, { ok: true }>["reason"],
  string
> = {
  not_found: "Không tìm thấy hồ sơ.",
  wrong_status:
    "Hồ sơ đã được xử lý hoặc không còn ở trạng thái này. Hãy tải lại để xem trạng thái mới.",
  self_decision: "Bạn không thể tự duyệt hồ sơ của chính mình.",
  has_store: "Tài khoản này đã có cửa hàng.",
  no_account: "Hồ sơ này thuộc một số điện thoại khác.",
  ineligible_account:
    "Tài khoản này không thể trở thành đối tác (tài khoản đã bị khóa hoặc là tài khoản quản trị).",
  phone_taken: "Số điện thoại này đã có một hồ sơ đối tác đang xử lý."
};

function unwrap(result: DecisionResult | CreateResult): MerchantApplication {
  if (result.ok) return result.application;
  if (result.reason === "not_found")
    throw new NotFoundException(DECISION_MESSAGES.not_found);
  if (result.reason === "self_decision" || result.reason === "no_account")
    throw new ForbiddenException(DECISION_MESSAGES[result.reason]);
  throw new ConflictException(DECISION_MESSAGES[result.reason]);
}

/**
 * The merchant application lifecycle. Submitting never grants anything; only
 * an Admin decision (or an Admin invitation claimed by its own phone) grants
 * the MERCHANT role, always together with the new store.
 */
@Injectable()
export class MerchantApplicationService {
  constructor(private readonly applications: MerchantApplicationRepository) {}

  // ---- Applicant ----

  async mine(user: AuthenticatedUser): Promise<MyApplicationDto> {
    const [account, application] = await Promise.all([
      this.applications.accountState(user.phone),
      this.applications.findLatestByPhone(user.phone)
    ]);
    const isMerchant = account.roles.includes(ApplicationRole.MERCHANT);
    const owned =
      application &&
      (application.applicantUserId === null ||
        application.applicantUserId === user.id)
        ? application
        : null;
    const status = owned?.status ?? null;
    return {
      isMerchant,
      application: owned ? toApplicationDto(owned) : null,
      history: owned
        ? (await this.applications.history(owned.id)).map((row) =>
            toEvent(row, false)
          )
        : [],
      canEdit:
        !isMerchant &&
        (!owned ||
          EDITABLE_STATUSES.includes(owned.status) ||
          status === S.REJECTED),
      canSubmit:
        !isMerchant && status !== null && canTransition("SUBMIT", status),
      canActivate:
        status === S.APPROVED &&
        owned!.activatedAt === null &&
        !account.storeId,
      canStartNew: !isMerchant && (!owned || status === S.REJECTED)
    };
  }

  /** Creates the applicant's draft, or edits it while it is still theirs to edit. */
  async save(
    user: AuthenticatedUser,
    input: ApplicationInput
  ): Promise<MyApplicationDto> {
    await this.assertNotMerchant(user);
    const open = await this.applications.findOpenByPhone(user.phone);
    if (!open) {
      unwrap(
        await this.applications.create({
          phone: user.phone,
          applicantUserId: user.id,
          source: MerchantApplicationSource.SELF,
          action: "CREATE_DRAFT",
          actorUserId: user.id,
          fields: fieldsOf(input)
        })
      );
      return this.mine(user);
    }
    if (open.applicantUserId !== user.id)
      throw new ConflictException(
        "THIGO đã tạo hồ sơ đối tác cho số này. Hãy kích hoạt tài khoản thay vì gửi hồ sơ mới."
      );
    if (!EDITABLE_STATUSES.includes(open.status))
      throw new ConflictException(
        open.status === S.PENDING_REVIEW
          ? "Hồ sơ đang chờ THIGO duyệt nên chưa sửa được."
          : "Hồ sơ đã được duyệt."
      );
    if (
      !(await this.applications.updateFields(open.id, user.id, fieldsOf(input)))
    )
      throw new ConflictException(DECISION_MESSAGES.wrong_status);
    return this.mine(user);
  }

  async submit(user: AuthenticatedUser): Promise<MyApplicationDto> {
    await this.assertNotMerchant(user);
    const open = await this.applications.findOpenByPhone(user.phone);
    if (!open || open.applicantUserId !== user.id)
      throw new NotFoundException("Bạn chưa có hồ sơ để gửi.");
    if (!(await this.applications.submit(open.id, user.id)))
      throw new ConflictException(DECISION_MESSAGES.wrong_status);
    return this.mine(user);
  }

  /** The approved phone signs in and receives the role and its store. */
  async activate(user: AuthenticatedUser): Promise<MyApplicationDto> {
    const open = await this.applications.findOpenByPhone(user.phone);
    if (!open || open.status !== S.APPROVED)
      throw new NotFoundException("Chưa có hồ sơ được duyệt cho số này.");
    if (open.applicantUserId !== null && open.applicantUserId !== user.id)
      throw new ForbiddenException(DECISION_MESSAGES.no_account);
    if (open.activatedAt) return this.mine(user);
    unwrap(
      await this.applications.activate(
        open.id,
        user.id,
        storeSlug(open.storeName)
      )
    );
    return this.mine(user);
  }

  private async assertNotMerchant(user: AuthenticatedUser) {
    const account = await this.applications.accountState(user.phone);
    if (account.roles.includes(ApplicationRole.MERCHANT))
      throw new ConflictException("Tài khoản này đã là đối tác THIGO.");
  }

  // ---- Admin ----

  async list(query: {
    status?: S | undefined;
    q?: string | undefined;
    page: number;
    pageSize: number;
  }) {
    const [{ rows, total }, counts] = await Promise.all([
      this.applications.list(query),
      this.applications.countsByStatus()
    ]);
    const byStatus = Object.fromEntries(
      Object.values(S).map((status) => [status, 0])
    ) as Record<S, number>;
    for (const row of counts)
      if (row.key in byStatus) byStatus[row.key as S] = Number(row.count);
    return {
      items: rows.map(toApplicationDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
      byStatus
    };
  }

  async detail(id: string): Promise<AdminApplicationDetailDto> {
    const application = isUuid(id)
      ? await this.applications.findById(id)
      : null;
    if (!application) throw new NotFoundException(DECISION_MESSAGES.not_found);
    const [account, history, store] = await Promise.all([
      this.applications.accountState(application.phone),
      this.applications.history(application.id),
      application.storeId
        ? this.applications.storeSummary(application.storeId)
        : Promise.resolve(null)
    ]);
    return {
      application: toApplicationDto(application),
      applicant: {
        userId: account.userId,
        hasAccount: account.userId !== null,
        roles: account.roles,
        hasStore: account.storeId !== null
      },
      store,
      history: history.map((row) => toEvent(row, true))
    };
  }

  /**
   * Admin-assisted onboarding. The application starts approved; an existing
   * account is activated at once, otherwise the role waits for that phone's
   * own OTP sign-in.
   */
  async createForPartner(
    admin: AuthenticatedUser,
    input: AdminApplicationInput
  ): Promise<AdminApplicationDetailDto> {
    if (input.accountPhone === admin.phone)
      throw new ForbiddenException(
        "Không thể tạo hồ sơ đối tác cho chính tài khoản quản trị đang dùng."
      );
    const account = await this.applications.accountState(input.accountPhone);
    if (account.storeId)
      throw new ConflictException(
        "Số điện thoại này đã có cửa hàng trên THIGO."
      );
    if (account.roles.includes(ApplicationRole.ADMIN))
      throw new ConflictException(DECISION_MESSAGES.ineligible_account);
    const created = unwrap(
      await this.applications.create({
        phone: input.accountPhone,
        applicantUserId: account.userId,
        source: MerchantApplicationSource.ADMIN,
        action: "ADMIN_CREATE",
        actorUserId: admin.id,
        fields: fieldsOf(input),
        ...(account.userId
          ? {
              activate: {
                userId: account.userId,
                slug: storeSlug(input.store.name)
              }
            }
          : {})
      })
    );
    return this.detail(created.id);
  }

  async decide(
    admin: AuthenticatedUser,
    id: string,
    action: "APPROVE" | "REQUEST_CHANGES" | "REJECT",
    note: string | null
  ): Promise<AdminApplicationDetailDto> {
    const application = isUuid(id)
      ? await this.applications.findById(id)
      : null;
    if (!application) throw new NotFoundException(DECISION_MESSAGES.not_found);
    unwrap(
      await this.applications.decide(
        id,
        action,
        admin.id,
        note,
        storeSlug(application.storeName)
      )
    );
    return this.detail(id);
  }
}
