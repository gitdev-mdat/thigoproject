import { MerchantApplicationStatus as S } from "../../entities/merchant/merchant-application.entity.js";

/** Every lifecycle step, who may take it, and where it may start and end. */
export const APPLICATION_ACTIONS = {
  /** The applicant saves a new application without sending it. */
  CREATE_DRAFT: { actor: "APPLICANT", from: [null], to: S.DRAFT },
  /** An Admin adds a partner directly; it starts approved. */
  ADMIN_CREATE: { actor: "ADMIN", from: [null], to: S.APPROVED },
  SUBMIT: {
    actor: "APPLICANT",
    from: [S.DRAFT, S.CHANGES_REQUESTED],
    to: S.PENDING_REVIEW
  },
  APPROVE: { actor: "ADMIN", from: [S.PENDING_REVIEW], to: S.APPROVED },
  REQUEST_CHANGES: {
    actor: "ADMIN",
    from: [S.PENDING_REVIEW],
    to: S.CHANGES_REQUESTED
  },
  REJECT: { actor: "ADMIN", from: [S.PENDING_REVIEW], to: S.REJECTED },
  /** Role and store granted; the status stays APPROVED. */
  ACTIVATE: { actor: "APPLICANT", from: [S.APPROVED], to: S.APPROVED }
} as const satisfies Record<
  string,
  {
    actor: "APPLICANT" | "ADMIN";
    from: readonly (S | null)[];
    to: S;
  }
>;

export type ApplicationAction = keyof typeof APPLICATION_ACTIONS;

/** The applicant may edit only before review or when changes were asked for. */
export const EDITABLE_STATUSES: readonly S[] = [S.DRAFT, S.CHANGES_REQUESTED];

/** Statuses that still occupy the phone; a rejected application frees it. */
export const OPEN_STATUSES: readonly S[] = [
  S.DRAFT,
  S.PENDING_REVIEW,
  S.CHANGES_REQUESTED,
  S.APPROVED
];

export function canTransition(
  action: ApplicationAction,
  from: S | null
): boolean {
  return (APPLICATION_ACTIONS[action].from as readonly (S | null)[]).includes(
    from
  );
}

/** "MA" + 6 base-32 characters; collisions are retried by the caller. */
export function applicationCode(random: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MA";
  for (let index = 0; index < 6; index += 1)
    code += alphabet[Math.floor(random() * alphabet.length)];
  return code;
}
