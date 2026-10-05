import { describe, expect, it } from "vitest";

import { colors, designTokens, sizes, spacing, typography } from "./index.js";

describe("design tokens", () => {
  it("exports one semantic token object", () => {
    expect(designTokens.colors.brand.primary).toBe(colors.brand.primary);
    expect(designTokens.typography.role.body).toBe(typography.role.body);
  });

  it("keeps spacing ordered from smallest to largest", () => {
    expect(Object.values(spacing)).toEqual([0, 4, 8, 12, 16, 24, 32, 48]);
  });

  it("keeps the shared touch target at least as large as each platform floor", () => {
    expect(sizes.touchTarget.minimum).toBeGreaterThanOrEqual(44);
    expect(sizes.touchTarget.recommended).toBeGreaterThanOrEqual(48);
  });
});
