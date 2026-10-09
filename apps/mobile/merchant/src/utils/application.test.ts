import { describe, expect, it } from "vitest";

import type { MyApplication } from "../types/application";
import {
  applicantView,
  applicationDraft,
  applicationInput,
  validateApplication
} from "./application";

const base: MyApplication = {
  isMerchant: false,
  media: [],
  application: null,
  history: [],
  canEdit: true,
  canSubmit: false,
  canActivate: false,
  canStartNew: true
};
const application = {
  id: "a",
  code: "MAABC123",
  status: "DRAFT" as const,
  source: "SELF" as const,
  accountPhone: "+84860000301",
  storeName: "Bếp Nhà Lan",
  category: "FOOD" as const,
  contactPhone: "+84901234567",
  addressLine: "27 Nguyễn Thị Minh Khai",
  description: null,
  contactName: "Trần Thị Lan",
  reviewNote: null,
  submittedAt: null,
  decidedAt: null,
  activatedAt: null,
  storeId: null,
  createdAt: "2026-10-09T00:00:00Z",
  updatedAt: "2026-10-09T00:00:00Z"
};

describe("applicant view", () => {
  it("follows the server's status, never local state", () => {
    expect(applicantView(base)).toBe("intro");
    const at = (
      status:
        | typeof application.status
        | "PENDING_REVIEW"
        | "CHANGES_REQUESTED"
        | "REJECTED"
        | "APPROVED",
      extra: Partial<MyApplication> = {}
    ) =>
      applicantView({
        ...base,
        ...extra,
        application: { ...application, status }
      });
    expect(at("DRAFT")).toBe("draft");
    expect(at("PENDING_REVIEW")).toBe("pending");
    expect(at("CHANGES_REQUESTED")).toBe("changes");
    expect(at("REJECTED")).toBe("rejected");
    expect(at("APPROVED", { canActivate: true })).toBe("invited");
    expect(at("APPROVED")).toBe("pending");
    expect(applicantView({ ...base, isMerchant: true })).toBe("merchant");
  });
});

describe("application form", () => {
  it("prefills from the application and maps back to the API shape", () => {
    const draft = applicationDraft(application);
    expect(draft.phone).toBe("0901 234 567");
    expect(
      applicationInput({ ...draft, contactName: "  Trần   Lan " })
    ).toEqual({
      storeName: "Bếp Nhà Lan",
      category: "FOOD",
      contactPhone: "0901234567",
      addressLine: "27 Nguyễn Thị Minh Khai",
      contactName: "Trần Lan"
    });
  });

  it("asks for the contact name", () => {
    const draft = { ...applicationDraft(application), contactName: " " };
    expect(validateApplication(draft).contactName).toBeDefined();
  });
});
