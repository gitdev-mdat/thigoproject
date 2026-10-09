import {
  assertDevelopmentFixturesEnabled,
  developmentFixturesEnabled
} from "../config/development-fixtures.js";
import { canonicalizeVietnamesePhone } from "../common/auth/phone-number.js";
import { ApplicationRole } from "../entities/auth/user-role.entity.js";

export const DEVELOPMENT_AUTH_FIXTURES = [
  { phone: "0860000001", role: ApplicationRole.CUSTOMER },
  { phone: "0860000002", role: ApplicationRole.MERCHANT },
  { phone: "0860000003", role: ApplicationRole.DRIVER },
  { phone: "0860000004", role: ApplicationRole.ADMIN },
  // A merchant with no storefront, for walking through onboarding.
  { phone: "0860000005", role: ApplicationRole.MERCHANT }
] as const;

/**
 * Seeded accounts offered by the "Đăng nhập nhanh (DEV)" shortcut. Each one
 * still signs in through the normal test OTP flow, so the server's role check
 * decides access exactly as it does for a typed phone number.
 */
export const DEVELOPMENT_QUICK_LOGIN_ACCOUNTS = [
  { phone: "0860000004", role: ApplicationRole.ADMIN, label: "Quản trị viên" },
  {
    phone: "0860000001",
    role: ApplicationRole.CUSTOMER,
    label: "Khách hàng mẫu"
  },
  {
    phone: "0860000002",
    role: ApplicationRole.MERCHANT,
    label: "Cơm Tấm Sài Gòn"
  },
  {
    phone: "0860000005",
    role: ApplicationRole.MERCHANT,
    label: "Chủ quán chưa có cửa hàng"
  },
  { phone: "0860000003", role: ApplicationRole.DRIVER, label: "Tài xế chính" },
  { phone: "0860000201", role: ApplicationRole.DRIVER, label: "Tài xế thứ hai" }
] as const;

export interface QuickLoginAccount {
  phone: string;
  label: string;
}

/**
 * Accounts for one application, or none unless development fixtures and the
 * test OTP provider are both on. Production can never reach a non-empty list:
 * both settings are startup errors there.
 */
export function developmentQuickLoginAccounts(
  environment: NodeJS.ProcessEnv,
  application: string
): QuickLoginAccount[] {
  if (
    !developmentFixturesEnabled(environment) ||
    environment.OTP_PROVIDER !== "test"
  )
    return [];
  return DEVELOPMENT_QUICK_LOGIN_ACCOUNTS.filter(
    (account) => account.role === application
  ).map(({ phone, label }) => ({ phone, label }));
}

export interface DevelopmentAuthFixtureWriter {
  ensureAccount(phone: string, role: ApplicationRole): Promise<void>;
}

export function assertDevelopmentSeedEnvironment(
  environment: NodeJS.ProcessEnv
): void {
  assertDevelopmentFixturesEnabled(environment, "dev:seed");
}

export async function seedDevelopmentAuthFixtures(
  writer: DevelopmentAuthFixtureWriter
): Promise<void> {
  for (const fixture of DEVELOPMENT_AUTH_FIXTURES) {
    await writer.ensureAccount(
      canonicalizeVietnamesePhone(fixture.phone),
      fixture.role
    );
  }
}
