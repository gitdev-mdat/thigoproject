import type { StoreCategory } from "./storefront";

export type ApplicationStatus =
  "DRAFT" | "PENDING_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";

export type MerchantApplication = {
  id: string;
  code: string;
  status: ApplicationStatus;
  source: "SELF" | "ADMIN";
  accountPhone: string;
  storeName: string;
  category: StoreCategory;
  contactPhone: string;
  addressLine: string;
  description: string | null;
  contactName: string;
  reviewNote: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  activatedAt: string | null;
  storeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationEvent = {
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  action: string;
  note: string | null;
  actorKind: "applicant" | "admin";
  createdAt: string;
};

export type ApplicationImage = {
  id: string;
  kind: "LOGO" | "COVER" | "PHOTO";
  contentType: string;
  byteSize: number;
  createdAt: string;
  url: string;
};

export type MyApplication = {
  media: ApplicationImage[];
  isMerchant: boolean;
  application: MerchantApplication | null;
  history: ApplicationEvent[];
  canEdit: boolean;
  canSubmit: boolean;
  canActivate: boolean;
  canStartNew: boolean;
};

export type ApplicationInput = {
  storeName: string;
  category: StoreCategory;
  contactPhone: string;
  addressLine: string;
  description?: string;
  contactName: string;
};
