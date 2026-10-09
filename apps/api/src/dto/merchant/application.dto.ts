import { BadRequestException } from "@nestjs/common";
import { canonicalizeVietnamesePhone } from "../../common/auth/phone-number.js";
import type { StoreCategory } from "../../entities/catalog/store.entity.js";
import type {
  MerchantApplicationSource,
  MerchantApplicationStatus
} from "../../entities/merchant/merchant-application.entity.js";
import { parseStoreProfile, type StoreProfileInput } from "./storefront.dto.js";

function invalid(message: string): never {
  throw new BadRequestException(message);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    invalid("Dữ liệu gửi lên không hợp lệ.");
  return value as Record<string, unknown>;
}

function line(value: unknown, min: number, max: number, label: string) {
  if (typeof value !== "string") invalid(`Vui lòng nhập ${label}.`);
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length < min) invalid(`${label} cần ít nhất ${min} ký tự.`);
  if (text.length > max) invalid(`${label} tối đa ${max} ký tự.`);
  return text;
}

/** The storefront the applicant proposes, plus who THIGO should contact. */
export interface ApplicationInput {
  store: StoreProfileInput;
  contactName: string;
}

/**
 * Only what a review needs: the store's name, type, address, phone and short
 * description, and the owner's name. No identity documents are collected.
 */
export function parseApplicationInput(body: unknown): ApplicationInput {
  const value = record(body);
  return {
    store: parseStoreProfile({
      name: value.storeName,
      category: value.category,
      description: value.description,
      addressLine: value.addressLine,
      phone: value.contactPhone
    }),
    contactName: line(value.contactName, 2, 80, "Tên người liên hệ")
  };
}

export interface AdminApplicationInput extends ApplicationInput {
  /** The account phone that will sign in to the Merchant app. */
  accountPhone: string;
}

export function parseAdminApplicationInput(
  body: unknown
): AdminApplicationInput {
  const value = record(body);
  let accountPhone: string;
  try {
    accountPhone = canonicalizeVietnamesePhone(
      typeof value.accountPhone === "string" ? value.accountPhone : ""
    );
  } catch {
    invalid("Số điện thoại đăng nhập của chủ quán không hợp lệ.");
  }
  return { ...parseApplicationInput(value), accountPhone };
}

/** A reason the applicant will read; required for changes and rejection. */
export function parseReviewReason(body: unknown): string {
  return line(record(body).reason, 5, 500, "Lý do");
}

export interface ApplicationDto {
  id: string;
  code: string;
  status: MerchantApplicationStatus;
  source: MerchantApplicationSource;
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
}

export interface ApplicationMediaRefDto {
  id: string;
  kind: "LOGO" | "COVER" | "PHOTO";
  contentType: string;
  byteSize: number;
  createdAt: string;
  url: string;
}

export interface ApplicationEventDto {
  fromStatus: MerchantApplicationStatus | null;
  toStatus: MerchantApplicationStatus;
  action: string;
  note: string | null;
  /** "applicant", "admin" or "system" for the applicant's view. */
  actorKind: "applicant" | "admin";
  /** Shown only to Admins. */
  actorPhone?: string;
  createdAt: string;
}

export interface MyApplicationDto {
  /** True once the MERCHANT role is held; the app should enter the store. */
  isMerchant: boolean;
  application: ApplicationDto | null;
  history: ApplicationEventDto[];
  /** Private images; URLs need the viewer's own session. */
  media: ApplicationMediaRefDto[];
  /** What the applicant can do now. */
  canEdit: boolean;
  canSubmit: boolean;
  canActivate: boolean;
  canStartNew: boolean;
}

export interface AdminApplicationDetailDto {
  application: ApplicationDto;
  applicant: {
    userId: string | null;
    hasAccount: boolean;
    roles: string[];
    hasStore: boolean;
  };
  store: {
    id: string;
    name: string;
    isPublished: boolean;
    availableProductCount: number;
    categoryCount: number;
    logoImageUrl: string | null;
    coverImageUrl: string | null;
  } | null;
  history: ApplicationEventDto[];
  /** Private images; URLs need the viewer's own session. */
  media: ApplicationMediaRefDto[];
}
