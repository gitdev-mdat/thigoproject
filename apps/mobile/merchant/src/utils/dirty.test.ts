import { describe, expect, it } from "vitest";

import { isDirty, sameDraft } from "./dirty";

describe("isDirty", () => {
  const saved = {
    name: "Cơm tấm",
    price: 35_000 as number | null,
    image: undefined as string | null | undefined,
    days: [{ closed: false, open: "07:00", close: "21:00" }]
  };

  it("is clean for an untouched or identical copy", () => {
    expect(isDirty(saved, saved)).toBe(false);
    expect(
      isDirty(saved, JSON.parse(JSON.stringify(saved)) as typeof saved)
    ).toBe(false);
  });

  it("detects a changed field, including inside arrays", () => {
    expect(isDirty(saved, { ...saved, name: "Cơm tấm sườn" })).toBe(true);
    expect(isDirty(saved, { ...saved, price: null })).toBe(true);
    expect(isDirty(saved, { ...saved, image: null })).toBe(true);
    expect(
      isDirty(saved, {
        ...saved,
        days: [{ closed: false, open: "07:00", close: "22:00" }]
      })
    ).toBe(true);
    expect(isDirty(saved, { ...saved, days: [] })).toBe(true);
  });

  it("is clean again when an edit is reverted", () => {
    const edited = { ...saved, name: "Phở" };
    expect(isDirty(saved, { ...edited, name: "Cơm tấm" })).toBe(false);
  });

  it("treats a missing key like undefined, but not like null", () => {
    expect(sameDraft({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(sameDraft({ a: 1, b: null }, { a: 1 })).toBe(false);
    expect(sameDraft(null, {})).toBe(false);
    expect(sameDraft([1], { 0: 1 })).toBe(false);
  });
});
