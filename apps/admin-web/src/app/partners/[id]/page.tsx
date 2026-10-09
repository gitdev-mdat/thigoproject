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
  formatPhone
} from "../../../components/format";
import {
  DecisionDialog,
  type Decision
} from "../../../components/partners/DecisionDialog";
import {
  ApplicationStatusBadge,
  Badge,
  Card,
  ErrorState,
  Icon,
  LoadingRows,
  PageHeader
} from "../../../components/ui";
import { useAdminQuery } from "../../../hooks/useAdminQuery";
import { AdminApiError, adminApi } from "../../../services/api";
import type { ApplicationDetail } from "../../../types/admin";

function consequence(decision: Decision, detail: ApplicationDetail): string {
  const app = detail.application;
  if (decision === "approve")
    return `${formatPhone(app.accountPhone)} sẽ được cấp quyền Chủ quán và cửa hàng “${app.storeName}” được tạo ở trạng thái chưa hiển thị. Chủ quán tự thêm thực đơn rồi mở bán.`;
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
        <Card>
          {query.status === "error" ? (
            <ErrorState
              message={query.message}
              onRetry={() => void query.reload()}
            />
          ) : (
            <LoadingRows />
          )}
        </Card>
      </>
    );

  const app = detail.application;
  const pending = app.status === "PENDING_REVIEW";
  return (
    <>
      <BackLink />
      <PageHeader
        title={app.storeName}
        description={`Hồ sơ ${app.code} · ${app.source === "ADMIN" ? "THIGO thêm" : "Chủ quán tự đăng ký"}`}
        actions={
          pending ? (
            <div className="decision-actions">
              <button
                type="button"
                className="button destructive-outline compact"
                onClick={() => setDecision("reject")}
              >
                Từ chối
              </button>
              <button
                type="button"
                className="button secondary compact"
                onClick={() => setDecision("request-changes")}
              >
                Yêu cầu bổ sung
              </button>
              <button
                type="button"
                className="button primary compact"
                onClick={() => setDecision("approve")}
              >
                Duyệt hồ sơ
              </button>
            </div>
          ) : null
        }
      />
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
      <div className="grid-main">
        <Card
          title="Thông tin cửa hàng"
          className="span-2"
          action={<ApplicationStatusBadge status={app.status} />}
        >
          {app.reviewNote &&
          (app.status === "CHANGES_REQUESTED" || app.status === "REJECTED") ? (
            <p
              className={`notice ${app.status === "REJECTED" ? "notice-danger" : "notice-info"}`}
            >
              {app.status === "REJECTED"
                ? "Lý do từ chối: "
                : "Đã yêu cầu bổ sung: "}
              {app.reviewNote}
            </p>
          ) : null}
          <dl className="facts">
            <div>
              <dt>Tên cửa hàng</dt>
              <dd>{app.storeName}</dd>
            </div>
            <div>
              <dt>Loại</dt>
              <dd>{CATEGORY_LABEL[app.category]}</dd>
            </div>
            <div>
              <dt>Địa chỉ</dt>
              <dd>{app.addressLine}</dd>
            </div>
            <div>
              <dt>Điện thoại quán</dt>
              <dd className="mono">{formatPhone(app.contactPhone)}</dd>
            </div>
            <div>
              <dt>Giới thiệu</dt>
              <dd>
                {app.description ?? <span className="muted">Chưa có</span>}
              </dd>
            </div>
            <div>
              <dt>Ảnh cửa hàng</dt>
              <dd className="muted">Chủ quán thêm sau khi được duyệt</dd>
            </div>
          </dl>
        </Card>
        <Card title="Chủ quán và tài khoản">
          <dl className="facts">
            <div>
              <dt>Người liên hệ</dt>
              <dd>{app.contactName}</dd>
            </div>
            <div>
              <dt>Số đăng nhập</dt>
              <dd className="mono">{formatPhone(app.accountPhone)}</dd>
            </div>
            <div>
              <dt>Tài khoản</dt>
              <dd>
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
              </dd>
            </div>
            <div>
              <dt>Cửa hàng</dt>
              <dd>
                {detail.store ? (
                  <Badge
                    tone={detail.store.isPublished ? "success" : "neutral"}
                  >
                    {detail.store.isPublished
                      ? "Đang hiển thị"
                      : "Chưa hiển thị"}
                  </Badge>
                ) : app.status === "APPROVED" ? (
                  <Badge tone="warning">Chờ chủ quán kích hoạt</Badge>
                ) : (
                  <span className="muted">Chưa tạo</span>
                )}
              </dd>
            </div>
          </dl>
          {app.status === "APPROVED" && !app.activatedAt ? (
            <p className="small muted">
              Chủ quán đăng nhập ứng dụng Nhà bán hàng bằng{" "}
              {formatPhone(app.accountPhone)} rồi bấm “Kích hoạt tài khoản đối
              tác”. Quyền chỉ được cấp sau khi số này xác thực OTP.
            </p>
          ) : null}
          {detail.store ? (
            <Link className="link small" href="/stores">
              Xem trong danh sách cửa hàng
            </Link>
          ) : null}
        </Card>
      </div>
      <Card
        title="Lịch sử hồ sơ"
        description="Mọi thay đổi trạng thái, ai thực hiện và lúc nào."
      >
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
      </Card>
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

function BackLink() {
  return (
    <Link href="/partners" className="back-link">
      <Icon name="back" size={16} />
      Danh sách đối tác
    </Link>
  );
}
