import { canonicalizeVietnamesePhone } from "../common/auth/phone-number.js";
import { ApplicationRole } from "../entities/auth/user-role.entity.js";

export const DEVELOPMENT_AUTH_FIXTURES = [
  { phone: "0860000001", role: ApplicationRole.CUSTOMER },
  { phone: "0860000002", role: ApplicationRole.MERCHANT },
  { phone: "0860000003", role: ApplicationRole.DRIVER },
  { phone: "0860000004", role: ApplicationRole.ADMIN }
] as const;

export interface DevelopmentAuthFixtureWriter {
  ensureAccount(phone: string, role: ApplicationRole): Promise<void>;
}

export function assertDevelopmentSeedEnvironment(
  environment: NodeJS.ProcessEnv
): void {
  if (environment.NODE_ENV === "production") {
    throw new Error(
      "dev:seed is development-only and cannot run when NODE_ENV=production."
    );
  }
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
