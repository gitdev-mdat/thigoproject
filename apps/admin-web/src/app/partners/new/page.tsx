"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CATEGORY_LABEL } from "../../../components/format";
import { Card, Icon, PageHeader } from "../../../components/ui";
import { AdminApiError, adminApi } from "../../../services/api";
import type { PartnerInput, StoreCategory } from "../../../types/admin";

type Draft = Omit<PartnerInput, "category" | "description"> & {
  category: StoreCategory | "";
  description: string;
};
type Errors = Partial<Record<keyof Draft, string>>;

const MOBILE = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;
const STORE_PHONE = /^(?:\+84|0)(?:2\d{9}|[35789]\d{8})$/;
const compact = (value: string) => value.replace(/[\s.()-]/g, "");

/** Client hints only; the API applies the same rules and decides. */
function validate(draft: Draft): Errors {
  const errors: Errors = {};
  if (!MOBILE.test(compact(draft.accountPhone)))
    errors.accountPhone =
      "Nhập số di động chủ quán dùng để đăng nhập, ví dụ 0901 234 567.";
  if (draft.contactName.trim().length < 2)
    errors.contactName = "Nhập họ tên người liên hệ.";
  if (draft.storeName.trim().length < 2)
    errors.storeName = "Tên cửa hàng cần ít nhất 2 ký tự.";
  if (!draft.category) errors.category = "Chọn loại cửa hàng.";
  if (!STORE_PHONE.test(compact(draft.contactPhone)))
    errors.contactPhone = "Số điện thoại cửa hàng chưa hợp lệ.";
  if (draft.addressLine.trim().length < 5)
    errors.addressLine = "Nhập địa chỉ đầy đủ (ít nhất 5 ký tự).";
  return errors;
}

export default function NewPartnerPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({
    accountPhone: "",
    contactName: "",
    storeName: "",
    category: "",
    contactPhone: "",
    addressLine: "",
    description: ""
  });
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setServerError("");
    if (tried) setErrors(validate(next));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length || !draft.category) return;
    setBusy(true);
    try {
      const description = draft.description.trim();
      const created = await adminApi.createPartner({
        accountPhone: compact(draft.accountPhone),
        contactName: draft.contactName.trim(),
        storeName: draft.storeName.trim(),
        category: draft.category,
        contactPhone: compact(draft.contactPhone),
        addressLine: draft.addressLine.trim(),
        ...(description ? { description } : {})
      });
      router.push(`/partners/${created.application.id}`);
    } catch (e) {
      setServerError(
        e instanceof AdminApiError && e.serverMessage
          ? e.serverMessage
          : "Chưa thêm được đối tác. Kiểm tra kết nối rồi thử lại."
      );
      setBusy(false);
    }
  };

  const field = (
    key: keyof Draft,
    label: string,
    input: React.ReactNode,
    helper?: string
  ) => (
    <label className="field">
      <span>{label}</span>
      {input}
      {errors[key] ? (
        <span className="error small">{errors[key]}</span>
      ) : helper ? (
        <span className="small muted">{helper}</span>
      ) : null}
    </label>
  );

  return (
    <>
      <Link href="/partners" className="back-link">
        <Icon name="back" size={16} />
        Danh sách đối tác
      </Link>
      <PageHeader
        title="Thêm đối tác"
        description="Dùng khi chủ quán đã làm việc trực tiếp với THIGO. Hồ sơ được duyệt ngay khi lưu."
      />
      <form
        className="partner-form"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        <Card
          title="Chủ quán"
          description="Số này dùng để đăng nhập ứng dụng Nhà bán hàng."
        >
          <div className="form-grid">
            {field(
              "accountPhone",
              "Số điện thoại đăng nhập",
              <input
                inputMode="tel"
                autoComplete="off"
                value={draft.accountPhone}
                aria-invalid={!!errors.accountPhone}
                onChange={(event) => set({ accountPhone: event.target.value })}
              />,
              "Nếu số đã có tài khoản THIGO, quyền Chủ quán được cấp ngay. Nếu chưa, quyền chỉ được cấp khi chủ quán đăng nhập bằng số này và bấm Kích hoạt."
            )}
            {field(
              "contactName",
              "Người liên hệ",
              <input
                value={draft.contactName}
                maxLength={80}
                aria-invalid={!!errors.contactName}
                onChange={(event) => set({ contactName: event.target.value })}
              />
            )}
          </div>
        </Card>
        <Card
          title="Cửa hàng"
          description="Cửa hàng được tạo ở trạng thái chưa hiển thị; chủ quán thêm thực đơn rồi mở bán."
        >
          <div className="form-grid">
            {field(
              "storeName",
              "Tên cửa hàng",
              <input
                value={draft.storeName}
                maxLength={120}
                aria-invalid={!!errors.storeName}
                onChange={(event) => set({ storeName: event.target.value })}
              />
            )}
            {field(
              "category",
              "Loại cửa hàng",
              <select
                value={draft.category}
                aria-invalid={!!errors.category}
                onChange={(event) =>
                  set({ category: event.target.value as StoreCategory | "" })
                }
              >
                <option value="">Chọn loại</option>
                {(Object.keys(CATEGORY_LABEL) as StoreCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABEL[key]}
                  </option>
                ))}
              </select>
            )}
            {field(
              "contactPhone",
              "Điện thoại cửa hàng",
              <input
                inputMode="tel"
                value={draft.contactPhone}
                aria-invalid={!!errors.contactPhone}
                onChange={(event) => set({ contactPhone: event.target.value })}
              />,
              "Số khách và tài xế gọi khi cần."
            )}
            {field(
              "addressLine",
              "Địa chỉ cửa hàng",
              <input
                value={draft.addressLine}
                maxLength={255}
                aria-invalid={!!errors.addressLine}
                onChange={(event) => set({ addressLine: event.target.value })}
              />
            )}
            <label className="field span-all">
              <span>Giới thiệu ngắn (không bắt buộc)</span>
              <textarea
                rows={3}
                maxLength={500}
                value={draft.description}
                onChange={(event) => set({ description: event.target.value })}
              />
            </label>
          </div>
        </Card>
        {serverError ? (
          <p className="notice notice-danger" role="alert">
            {serverError}
          </p>
        ) : null}
        <div className="form-actions">
          <Link href="/partners" className="button secondary">
            Hủy
          </Link>
          <button type="submit" className="button primary" disabled={busy}>
            {busy ? "Đang lưu…" : "Thêm và duyệt đối tác"}
          </button>
        </div>
      </form>
    </>
  );
}
