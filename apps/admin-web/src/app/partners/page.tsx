"use client";

import Link from "next/link";
import { useState } from "react";

import {
  CATEGORY_LABEL,
  formatPhone,
  formatRelative
} from "../../components/format";
import {
  CatalogImage,
  ImagePlaceholder,
  PrivateImage
} from "../../components/media";
import {
  partnerJourney,
  partnerStage
} from "../../components/partners/journey";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingRows,
  PageHeader,
  Pagination,
  SearchField,
  Segmented
} from "../../components/ui";
import { useAdminQuery } from "../../hooks/useAdminQuery";
import { useDebounced } from "../../hooks/useDebounced";
import { adminApi } from "../../services/api";
import type { ApplicationStatus } from "../../types/admin";

type Filter = ApplicationStatus | "ALL";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "PENDING_REVIEW", label: "Chờ duyệt" },
  { value: "CHANGES_REQUESTED", label: "Chờ bổ sung" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
  { value: "DRAFT", label: "Nháp" },
  { value: "ALL", label: "Tất cả" }
];

const EMPTY: Record<Filter, string> = {
  PENDING_REVIEW: "Không có hồ sơ nào đang chờ duyệt.",
  CHANGES_REQUESTED: "Không có hồ sơ nào đang chờ chủ quán bổ sung.",
  APPROVED: "Chưa có đối tác nào được duyệt qua quy trình này.",
  REJECTED: "Chưa có hồ sơ nào bị từ chối.",
  DRAFT: "Không có hồ sơ nháp.",
  ALL: "Chưa có hồ sơ đối tác nào."
};

export default function PartnersPage() {
  const [filter, setFilter] = useState<Filter>("PENDING_REVIEW");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());
  const filters = {
    status: filter === "ALL" ? undefined : filter,
    q: q || undefined,
    page
  };
  const query = useAdminQuery(
    () => adminApi.applications(filters),
    JSON.stringify(filters)
  );
  const counts = query.data?.byStatus;

  return (
    <>
      <PageHeader
        title="Đối tác"
        description="Hồ sơ đăng ký làm đối tác, quyết định duyệt và đối tác do THIGO thêm."
        actions={
          <Link href="/partners/new" className="button primary compact">
            <Icon name="plus" size={16} />
            Thêm đối tác
          </Link>
        }
      />
      <Card>
        <div className="toolbar">
          <Segmented<Filter>
            label="Lọc theo trạng thái hồ sơ"
            value={filter}
            onChange={(value) => {
              setFilter(value);
              setPage(1);
            }}
            options={FILTERS.map((item) => ({
              ...item,
              ...(counts && item.value !== "ALL"
                ? { count: counts[item.value] }
                : {})
            }))}
          />
          <div className="toolbar-end">
            <SearchField
              label="Tìm hồ sơ"
              placeholder="Tên quán, mã hồ sơ, người liên hệ, số điện thoại"
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </div>
        </div>
        {query.status === "error" ? (
          <ErrorState
            message={query.message}
            onRetry={() => void query.reload()}
          />
        ) : !query.data ? (
          <LoadingRows />
        ) : !query.data.items.length ? (
          <EmptyState
            title={q ? "Không có hồ sơ phù hợp" : EMPTY[filter]}
            description={
              q
                ? "Thử đổi từ khóa hoặc chọn trạng thái khác."
                : "Hồ sơ mới từ ứng dụng Nhà bán hàng sẽ xuất hiện ở đây."
            }
          />
        ) : (
          <>
            <ul className="partner-list" aria-busy={query.status === "loading"}>
              {query.data.items.map((item) => {
                const stage = partnerStage({
                  status: item.status,
                  activatedAt: item.activatedAt,
                  store: item.store
                });
                const steps = partnerJourney({
                  status: item.status,
                  activatedAt: item.activatedAt,
                  store: item.store
                });
                return (
                  <li key={item.id}>
                    <Link href={`/partners/${item.id}`} className="partner-row">
                      <span className="partner-thumb">
                        {item.previewUrl ? (
                          <PrivateImage url={item.previewUrl} alt="" />
                        ) : (
                          <CatalogImage
                            url={item.store?.coverImageUrl}
                            alt=""
                            fallback={
                              <ImagePlaceholder
                                label={item.storeName}
                                category={item.category}
                                size="sm"
                              />
                            }
                          />
                        )}
                      </span>
                      <span className="partner-main">
                        <strong>{item.storeName}</strong>
                        <span className="small muted">
                          {CATEGORY_LABEL[item.category]} · {item.contactName} ·{" "}
                          {formatPhone(item.accountPhone)}
                        </span>
                        <span className="mini-journey" aria-hidden="true">
                          {steps.map((step) => (
                            <i key={step.key} className={`is-${step.state}`} />
                          ))}
                        </span>
                      </span>
                      <span className="partner-meta">
                        <Badge tone={stage.tone}>{stage.label}</Badge>
                        <span className="small muted">
                          {item.source === "ADMIN"
                            ? "THIGO thêm"
                            : "Tự đăng ký"}
                          {item.mediaCount ? ` · ${item.mediaCount} ảnh` : ""}
                        </span>
                        <span className="small muted">
                          {formatRelative(item.updatedAt)}
                        </span>
                      </span>
                      <Icon name="chevronRight" size={18} />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={query.data.page}
              pageSize={query.data.pageSize}
              total={query.data.total}
              onPage={setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
