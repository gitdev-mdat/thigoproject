import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import {
  parseAdminApplicationInput,
  parseApplicationInput,
  parseReviewReason
} from "../../dto/merchant/application.dto.js";
import { MerchantApplicationStatus as S } from "../../entities/merchant/merchant-application.entity.js";
import {
  APPLICATION_ACTIONS,
  EDITABLE_STATUSES,
  applicationCode,
  canTransition
} from "./application-lifecycle.js";

describe("merchant application lifecycle", () => {
  it("allows only the defined transitions", () => {
    expect(canTransition("SUBMIT", S.DRAFT)).toBe(true);
    expect(canTransition("SUBMIT", S.CHANGES_REQUESTED)).toBe(true);
    expect(canTransition("SUBMIT", S.PENDING_REVIEW)).toBe(false);
    expect(canTransition("SUBMIT", S.REJECTED)).toBe(false);
    for (const action of ["APPROVE", "REQUEST_CHANGES", "REJECT"] as const) {
      expect(canTransition(action, S.PENDING_REVIEW)).toBe(true);
      for (const status of [
        S.DRAFT,
        S.CHANGES_REQUESTED,
        S.APPROVED,
        S.REJECTED
      ])
        expect(canTransition(action, status)).toBe(false);
    }
  });

  it("never lets a rejected application become approved or active", () => {
    for (const [action, rule] of Object.entries(APPLICATION_ACTIONS))
      if (rule.to === S.APPROVED)
        expect(
          canTransition(action as keyof typeof APPLICATION_ACTIONS, S.REJECTED)
        ).toBe(false);
  });

  it("gives every decision to an Admin and every edit to the applicant", () => {
    expect(APPLICATION_ACTIONS.APPROVE.actor).toBe("ADMIN");
    expect(APPLICATION_ACTIONS.REJECT.actor).toBe("ADMIN");
    expect(APPLICATION_ACTIONS.REQUEST_CHANGES.actor).toBe("ADMIN");
    expect(APPLICATION_ACTIONS.SUBMIT.actor).toBe("APPLICANT");
    expect(EDITABLE_STATUSES).toEqual([S.DRAFT, S.CHANGES_REQUESTED]);
  });

  it("makes short readable codes", () => {
    expect(applicationCode()).toMatch(/^MA[A-HJ-NP-Z2-9]{6}$/);
  });
});

describe("merchant application input", () => {
  const valid = {
    storeName: "  Bún Chả   Hà Nội ",
    category: "FOOD",
    contactPhone: "0901 234 567",
    addressLine: "12 Lý Tự Trọng, Q.1",
    description: "Bún chả than hoa",
    contactName: "Nguyễn Văn An"
  };

  it("normalizes the proposal and reuses the storefront rules", () => {
    expect(parseApplicationInput(valid)).toEqual({
      store: {
        name: "Bún Chả Hà Nội",
        category: "FOOD",
        description: "Bún chả than hoa",
        addressLine: "12 Lý Tự Trọng, Q.1",
        phone: "+84901234567"
      },
      contactName: "Nguyễn Văn An"
    });
  });

  it.each([
    { contactPhone: "123" },
    { category: "PIZZA" },
    { storeName: "A" },
    { addressLine: "Q1" },
    { contactName: "" }
  ])("rejects an invalid field %o", (patch) => {
    expect(() => parseApplicationInput({ ...valid, ...patch })).toThrow(
      BadRequestException
    );
  });

  it("requires a valid account phone for Admin onboarding", () => {
    expect(
      parseAdminApplicationInput({ ...valid, accountPhone: "0912 345 678" })
        .accountPhone
    ).toBe("+84912345678");
    expect(() =>
      parseAdminApplicationInput({ ...valid, accountPhone: "02812345678" })
    ).toThrow(BadRequestException);
  });

  it("requires a readable reason for changes and rejection", () => {
    expect(parseReviewReason({ reason: "  Thiếu địa chỉ cụ thể  " })).toBe(
      "Thiếu địa chỉ cụ thể"
    );
    expect(() => parseReviewReason({ reason: "ok" })).toThrow(
      BadRequestException
    );
    expect(() => parseReviewReason({})).toThrow(BadRequestException);
  });
});
