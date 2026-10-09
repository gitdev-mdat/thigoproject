import type {
  ApplicationEvent,
  ApplicationInput,
  MerchantApplication,
  MyApplication
} from "../types/application";
import {
  profileDraft,
  profileInput,
  validateProfile,
  type StoreProfileDraft,
  type StoreProfileErrors
} from "./storefront";

export type ApplicationDraft = StoreProfileDraft & { contactName: string };
export type ApplicationErrors = StoreProfileErrors & { contactName?: string };

/** Which screen the applicant sees; decided only by the server's answer. */
export type ApplicantView =
  | "intro"
  | "draft"
  | "pending"
  | "changes"
  | "rejected"
  | "invited"
  | "merchant";

export function applicantView(mine: MyApplication): ApplicantView {
  if (mine.isMerchant) return "merchant";
  const status = mine.application?.status;
  if (!status) return "intro";
  if (status === "APPROVED") return mine.canActivate ? "invited" : "pending";
  if (status === "PENDING_REVIEW") return "pending";
  if (status === "CHANGES_REQUESTED") return "changes";
  if (status === "REJECTED") return "rejected";
  return "draft";
}

export function applicationDraft(
  application: MerchantApplication | null
): ApplicationDraft {
  return {
    ...profileDraft(
      application
        ? {
            name: application.storeName,
            category: application.category,
            addressLine: application.addressLine,
            phone: application.contactPhone,
            description: application.description
          }
        : null
    ),
    contactName: application?.contactName ?? ""
  };
}

export function validateApplication(
  draft: ApplicationDraft
): ApplicationErrors {
  const errors: ApplicationErrors = validateProfile(draft);
  const name = draft.contactName.trim();
  if (name.length < 2) errors.contactName = "Nhập họ tên người liên hệ.";
  else if (name.length > 80) errors.contactName = "Tối đa 80 ký tự.";
  return errors;
}

export function applicationInput(draft: ApplicationDraft): ApplicationInput {
  const store = profileInput(draft);
  return {
    storeName: store.name,
    category: store.category,
    contactPhone: store.phone,
    addressLine: store.addressLine,
    ...(store.description ? { description: store.description } : {}),
    contactName: draft.contactName.trim().replace(/\s+/g, " ")
  };
}

const EVENT_LABEL: Record<string, string> = {
  CREATE_DRAFT: "Bạn tạo hồ sơ",
  SUBMIT: "Bạn gửi hồ sơ",
  ADMIN_CREATE: "THIGO tạo hồ sơ và duyệt cho bạn",
  APPROVE: "THIGO duyệt hồ sơ",
  REQUEST_CHANGES: "THIGO yêu cầu bổ sung",
  REJECT: "THIGO từ chối hồ sơ",
  ACTIVATE: "Tài khoản đối tác được kích hoạt"
};

export function eventLabel(event: ApplicationEvent): string {
  if (event.action === "SUBMIT" && event.fromStatus === "CHANGES_REQUESTED")
    return "Bạn gửi lại hồ sơ";
  return EVENT_LABEL[event.action] ?? "Cập nhật hồ sơ";
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
