import { ApplicationRole } from "../../entities/auth/user-role.entity.js";

/**
 * Signing in to the Merchant app to apply as a partner. It is not a role: the
 * session only proves the phone, and every merchant API still needs MERCHANT.
 */
export const MERCHANT_APPLICANT = "MERCHANT_APPLICANT";
export type SignInPurpose = ApplicationRole | typeof MERCHANT_APPLICANT;

export function isSignInPurpose(value: unknown): value is SignInPurpose {
  return (
    value === MERCHANT_APPLICANT ||
    Object.values(ApplicationRole).includes(value as ApplicationRole)
  );
}
