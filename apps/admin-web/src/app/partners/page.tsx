"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  CATEGORY_LABEL,
  formatPhone,
  formatRelative
} from "../../components/format";
import {
  ApplicationStatusBadge,
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
  const router = useRouter();
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
            <div className="table-wrap" aria-busy={query.status === "loading"}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Cửa hàng</th>
                    <th scope="col">Chủ quán</th>
                    <th scope="col" className="hide-md">
                      Nguồn
                    </th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col" className="hide-sm">
                      Cập nhật
                    </th>
                    <th scope="col">
                      <span className="sr-only">Mở hồ sơ</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="row-link"
                      onClick={() => router.push(`/partners/${item.id}`)}
                    >
                      <td>
                        <strong>{item.storeName}</strong>
                        <span className="cell-sub">
                          {CATEGORY_LABEL[item.category]} · {item.code}
                        </span>
                      </td>
                      <td>
                        {item.contactName}
                        <span className="cell-sub">
                          {formatPhone(item.accountPhone)}
                        </span>
                      </td>
                      <td className="hide-md">
                        {item.source === "ADMIN" ? "THIGO thêm" : "Tự đăng ký"}
                      </td>
                      <td>
                        <ApplicationStatusBadge status={item.status} />
                        {item.status === "APPROVED" && !item.activatedAt ? (
                          <span className="cell-sub">
                            Chờ chủ quán kích hoạt
                          </span>
                        ) : null}
                      </td>
                      <td className="hide-sm muted">
                        {formatRelative(item.updatedAt)}
                      </td>
                      <td className="num">
                        <Link
                          className="link small"
                          href={`/partners/${item.id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {item.status === "PENDING_REVIEW"
                            ? "Xem và duyệt"
                            : "Xem hồ sơ"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
