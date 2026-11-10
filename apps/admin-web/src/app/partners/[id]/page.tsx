"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import {
  APPLICATION_EVENT,
  APPLICATION_STATUS,
  CATEGORY_LABEL,
  ROLE_LABEL,
  formatDateTime,
  formatPhone,
  formatRelative
} from "../../../components/format";
import {
  CatalogImage,
  ImagePlaceholder,
  Journey,
  Lightbox,
  PrivateImage
} from "../../../components/media";
import {
  DecisionDialog,
  type Decision
} from "../../../components/partners/DecisionDialog";
import { partnerJourney } from "../../../components/partners/journey";
import {
  ApplicationStatusBadge,
  Badge,
  ErrorState,
  Icon,
  LoadingRows
} from "../../../components/ui";
import { useAdminQuery } from "../../../hooks/useAdminQuery";
import { AdminApiError, adminApi } from "../../../services/api";
import type { ApplicationDetail, ApplicationMedia } from "../../../types/admin";

const MEDIA_LABEL: Record<ApplicationMedia["kind"], string> = {
  LOGO: "Logo",
  COVER: "Ảnh bìa",
  PHOTO: "Ảnh quán"
};

function consequence(decision: Decision, detail: ApplicationDetail): string {
  const app = detail.application;
  if (decision === "approve")
    return `${formatPhone(app.accountPhone)} sẽ được cấp quyền Chủ quán và cửa hàng “${app.storeName}” được tạo ở trạng thái chưa hiển thị. Ảnh trong hồ sơ không tự trở thành ảnh cửa hàng; chủ quán tự thêm thực đơn và ảnh rồi mở bán.`;
  if (decision === "request-changes")
    return "Hồ sơ trở về cho chủ quán sửa. Chủ quán chưa có quyền gì cho đến khi được duyệt.";
  return "Hồ sơ đóng lại và không thể duyệt nữa. Chủ quán có thể nộp hồ sơ mới.";
}

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useAdminQuery(() => adminApi.application(id), id);
  const [decision, setDecision] = useState<Decision>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [preview, setPreview] = useState<ApplicationMedia>();
  const detail = query.data;

  const decide = async (reason: string) => {
    if (!decision) return;
    setBusy(true);
    setError("");
    try {
      await adminApi.decide(id, decision, reason || undefined);
      setResult(
        decision === "approve"
          ? "Đã duyệt. Quyền Chủ quán và cửa hàng đã được tạo."
          : decision === "reject"
            ? "Đã từ chối hồ sơ."
            : "Đã gửi yêu cầu bổ sung cho chủ quán."
      );
      setDecision(undefined);
      await query.reload();
    } catch (e) {
      setError(
        e instanceof AdminApiError && e.serverMessage
          ? e.serverMessage
          : "Chưa lưu được quyết định. Kiểm tra kết nối rồi thử lại."
      );
      // Another Admin may have decided first: show the current state.
      void query.reload();
    } finally {
      setBusy(false);
    }
  };

  if (!detail)
    return (
      <>
        <BackLink />
        <section className="card">
          {query.status === "error" ? (
            <ErrorState
              message={query.message}
              onRetry={() => void query.reload()}
            />
          ) : (
            <LoadingRows />
          )}
        </section>
      </>
    );

  const app = detail.application;
  const cover = detail.media.find((item) => item.kind === "COVER");
  const logo = detail.media.find((item) => item.kind === "LOGO");
  const photos = detail.media.filter((item) => item.kind === "PHOTO");
  const lastRequest = [...detail.history]
    .reverse()
    .find((event) => event.action === "REQUEST_CHANGES");
  const resubmittedAfterRequest =
    lastRequest &&
    detail.history.some(
      (event) =>
        event.action === "SUBMIT" && event.createdAt > lastRequest.createdAt
    );
  const pending = app.status === "PENDING_REVIEW";
  const journey = partnerJourney({
    status: app.status,
    activatedAt: app.activatedAt,
    store: detail.store
  });

  return (
    <>
      <BackLink />
      <section className="review-hero">
        <div className="review-cover">
          {cover ? (
            <button
              type="button"
              className="media-button"
              onClick={() => setPreview(cover)}
              aria-label="Xem ảnh bìa lớn"
            >
              <PrivateImage url={cover.url} alt="Ảnh bìa trong hồ sơ" />
            </button>
          ) : (
            <ImagePlaceholder
              label={app.storeName}
              category={app.category}
              size="lg"
            />
          )}
        </div>
        <div className="review-identity">
          <div className="review-logo">
            {logo ? (
              <button
                type="button"
                className="media-button"
                onClick={() => setPreview(logo)}
                aria-label="Xem logo lớn"
              >
                <PrivateImage url={logo.url} alt="Logo trong hồ sơ" />
              </button>
            ) : (
              <ImagePlaceholder label={app.storeName} size="sm" />
            )}
          </div>
          <div className="review-title">
            <div className="badges">
              <ApplicationStatusBadge status={app.status} />
              <span className="chip">{CATEGORY_LABEL[app.category]}</span>
              <span className="chip">
                {app.source === "ADMIN" ? "THIGO thêm" : "Tự đăng ký"}
              </span>
            </div>
            <h1>{app.storeName}</h1>
            <p className="muted">
              Hồ sơ {app.code}
              {app.submittedAt
                ? ` · gửi ${formatRelative(app.submittedAt).toLowerCase()}`
                : " · chưa gửi"}
            </p>
          </div>
        </div>
      </section>

      <Journey steps={journey} />

      {result ? (
        <p className="notice notice-success" role="status">
          {result}
        </p>
      ) : null}
      {error && !decision ? (
        <p className="notice notice-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="review-layout">
        <div className="review-main">
          {app.reviewNote &&
          (app.status === "CHANGES_REQUESTED" || app.status === "REJECTED") ? (
            <p
              className={`notice ${app.status === "REJECTED" ? "notice-danger" : "notice-info"}`}
            >
              <strong>
                {app.status === "REJECTED"
                  ? "Lý do từ chối"
                  : "Đã yêu cầu bổ sung"}
                :
              </strong>{" "}
              {app.reviewNote}
            </p>
          ) : null}
          {pending && resubmittedAfterRequest && lastRequest ? (
            <p className="notice notice-info">
              <strong>Chủ quán đã gửi lại sau yêu cầu bổ sung.</strong> Yêu cầu
              trước: “{lastRequest.note}”
            </p>
          ) : null}

          <section className="card">
            <div className="card-head">
              <h2>Thông tin kinh doanh</h2>
            </div>
            {app.description ? (
              <p className="review-description">{app.description}</p>
            ) : (
              <p className="muted">Chủ quán chưa viết giới thiệu.</p>
            )}
            <div className="info-grid">
              <InfoItem
                icon="pin"
                label="Địa chỉ quán"
                value={app.addressLine}
              />
              <InfoItem
                icon="phone"
                label="Điện thoại quán"
                value={formatPhone(app.contactPhone)}
              />
              <InfoItem
                icon="user"
                label="Người liên hệ"
                value={app.contactName}
              />
              <InfoItem
                icon="user"
                label="Số đăng nhập"
                value={formatPhone(app.accountPhone)}
              />
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>Ảnh trong hồ sơ</h2>
                <p className="muted small">
                  Chỉ quản trị và chủ quán xem được. Ảnh không tự đưa lên cửa
                  hàng.
                </p>
              </div>
              <span className="chip">{detail.media.length} ảnh</span>
            </div>
            {detail.media.length ? (
              <div className="media-grid">
                {[
                  ...(logo ? [logo] : []),
                  ...(cover ? [cover] : []),
                  ...photos
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`media-tile kind-${item.kind.toLowerCase()}`}
                    onClick={() => setPreview(item)}
                  >
                    <PrivateImage url={item.url} alt={MEDIA_LABEL[item.kind]} />
                    <span className="media-tile-label">
                      {MEDIA_LABEL[item.kind]}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="state">
                <Icon name="image" />
                <strong>Chủ quán chưa gửi ảnh nào</strong>
                <span className="muted small">
                  Ảnh là tùy chọn. Có thể yêu cầu bổ sung nếu cần xem mặt tiền
                  hoặc món.
                </span>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Lịch sử hồ sơ</h2>
            </div>
            <ol className="timeline">
              {[...detail.history].reverse().map((event, index) => (
                <li key={`${event.createdAt}-${index}`}>
                  <span
                    className={`timeline-dot tone-${APPLICATION_STATUS[event.toStatus].tone}`}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>
                      {APPLICATION_EVENT[event.action] ?? event.action}
                    </strong>
                    <span className="small muted">
                      {formatDateTime(event.createdAt)} ·{" "}
                      {event.actorKind === "admin" ? "Quản trị" : "Chủ quán"}{" "}
                      {formatPhone(event.actorPhone ?? null)}
                    </span>
                    {event.note ? (
                      <p className="timeline-note">{event.note}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="review-side">
          <section className="card decision-card">
            {pending ? (
              <>
                <h2>Quyết định</h2>
                <p className="muted small">
                  Duyệt sẽ cấp quyền Chủ quán và tạo cửa hàng chưa hiển thị.
                </p>
                <button
                  type="button"
                  className="button primary block"
                  onClick={() => setDecision("approve")}
                >
                  Duyệt hồ sơ
                </button>
                <button
                  type="button"
                  className="button secondary block"
                  onClick={() => setDecision("request-changes")}
                >
                  Yêu cầu bổ sung
                </button>
                <button
                  type="button"
                  className="button destructive-outline block"
                  onClick={() => setDecision("reject")}
                >
                  Từ chối
                </button>
              </>
            ) : (
              <>
                <h2>Trạng thái</h2>
                <ApplicationStatusBadge status={app.status} />
                <p className="muted small">
                  {app.status === "DRAFT"
                    ? "Chủ quán chưa gửi hồ sơ. Chưa có gì để quyết định."
                    : app.status === "CHANGES_REQUESTED"
                      ? "Đang chờ chủ quán sửa và gửi lại."
                      : app.status === "REJECTED"
                        ? "Hồ sơ đã đóng."
                        : app.activatedAt
                          ? "Đã cấp quyền Chủ quán và tạo cửa hàng."
                          : "Chờ chủ quán đăng nhập bằng số đã đăng ký và bấm Kích hoạt."}
                </p>
                {app.decidedAt ? (
                  <p className="small muted">
                    Quyết định lúc {formatDateTime(app.decidedAt)}
                  </p>
                ) : null}
              </>
            )}
          </section>

          <section className="card">
            <h2>Tài khoản</h2>
            {detail.applicant.hasAccount ? (
              <div className="badges">
                {detail.applicant.roles.map((role) => (
                  <span key={role} className="chip">
                    {ROLE_LABEL[role] ?? role}
                  </span>
                ))}
              </div>
            ) : (
              <Badge tone="neutral">Chưa đăng nhập lần nào</Badge>
            )}
            <p className="small muted">{formatPhone(app.accountPhone)}</p>
          </section>

          {detail.store ? (
            <Link
              href={`/stores/${detail.store.id}`}
              className="store-link-card"
            >
              <div className="store-link-media">
                <CatalogImage
                  url={detail.store.coverImageUrl}
                  alt=""
                  fallback={
                    <ImagePlaceholder label={detail.store.name} size="sm" />
                  }
                />
              </div>
              <div>
                <span className="small muted">Cửa hàng</span>
                <strong>{detail.store.name}</strong>
                <span className="small muted">
                  {detail.store.availableProductCount} món đang bán ·{" "}
                  {detail.store.isPublished ? "Đang hiển thị" : "Chưa hiển thị"}
                </span>
              </div>
              <Icon name="chevronRight" size={18} />
            </Link>
          ) : null}
        </aside>
      </div>

      {preview ? (
        <Lightbox
          title={`${MEDIA_LABEL[preview.kind]} · ${app.storeName}`}
          caption={`${Math.round(preview.byteSize / 1024)} KB · tải lên ${formatDateTime(preview.createdAt)}`}
          onClose={() => setPreview(undefined)}
        >
          <PrivateImage url={preview.url} alt={MEDIA_LABEL[preview.kind]} />
        </Lightbox>
      ) : null}
      {decision ? (
        <DecisionDialog
          decision={decision}
          consequence={consequence(decision, detail)}
          busy={busy}
          error={error}
          onCancel={() => {
            setDecision(undefined);
            setError("");
          }}
          onConfirm={(reason) => void decide(reason)}
        />
      ) : null}
    </>
  );
}

function InfoItem({
  icon,
  label,
  value
}: {
  icon: "pin" | "phone" | "user";
  label: string;
  value: string;
}) {
  return (
    <div className="info-item">
      <span className="info-icon" aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <span className="small muted">{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/partners" className="back-link">
      <Icon name="back" size={16} />
      Danh sách đối tác
    </Link>
  );
}
