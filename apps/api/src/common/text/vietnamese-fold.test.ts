import { describe, expect, it } from "vitest";
import {
  VIETNAMESE_FOLD_FROM,
  VIETNAMESE_FOLD_TO,
  foldVietnamese
} from "./vietnamese-fold.js";

describe("foldVietnamese", () => {
  it("strips tones and marks in both cases", () => {
    expect(foldVietnamese("Trà Sữa Đường Đen")).toBe("tra sua duong den");
    expect(foldVietnamese("CÀ PHÊ MUỐI")).toBe("ca phe muoi");
  });

  it("keeps the SQL translate() maps aligned one-to-one", () => {
    expect([...VIETNAMESE_FOLD_FROM]).toHaveLength(
      [...VIETNAMESE_FOLD_TO].length
    );
    expect(VIETNAMESE_FOLD_TO).toMatch(/^[a-z]+$/);
  });
});
