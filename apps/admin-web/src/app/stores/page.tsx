"use client";

import Link from "next/link";
import { useState } from "react";

import { CatalogImage, ImagePlaceholder } from "../../components/media";

import {
  CATEGORY_LABEL,
  formatCount,
  formatPhone,
  formatCompactVnd
} from "../../components/format";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  Pagination,
  SearchField,
  Segmented
} from "../../components/ui";
import { useAdminQuery } from "../../hooks/useAdminQuery";
import { useDebounced } from "../../hooks/useDebounced";
import { adminApi } from "../../services/api";
import type { StoreCategory } from "../../types/admin";

type Visibility = "all" | "published" | "hidden";

export default function StoresPage() {
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [category, setCategory] = useState<StoreCategory | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());
  const filters = {
    visibility: visibility === "all" ? undefined : visibility,
    category: category || undefined,
    q: q || undefined,
    page
  };
  const query = useAdminQuery(
    () => adminApi.stores(filters),
    JSON.stringify(filters)
  );
  const reset =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };

  return (
    <>
      <PageHeader
        title="Cửa hàng"
        description="Mọi cửa hàng trên THIGO, trạng thái hiển thị và hiệu quả bán hàng."
      />
      <Card>
        <div className="toolbar">
          <Segmented<Visibility>
            label="Lọc theo hiển thị"
            value={visibility}
            onChange={reset(setVisibility)}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "published", label: "Đang hiển thị" },
              { value: "hidden", label: "Chưa hiển thị" }
            ]}
          />
          <div className="toolbar-end">
            <label className="select">
              <span className="sr-only">Loại cửa hàng</span>
              <select
                value={category}
                onChange={(event) =>
                  reset(setCategory)(event.target.value as StoreCategory | "")
                }
              >
                <option value="">Mọi loại</option>
                {(Object.keys(CATEGORY_LABEL) as StoreCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABEL[key]}
                  </option>
                ))}
              </select>
            </label>
            <SearchField
              label="Tìm cửa hàng"
              placeholder="Tìm tên hoặc địa chỉ"
              value={search}
              onChange={reset(setSearch)}
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
            title="Không có cửa hàng phù hợp"
            description="Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm."
          />
        ) : (
          <>
            <ul className="store-grid" aria-busy={query.status === "loading"}>
              {query.data.items.map((store) => (
                <li key={store.id}>
                  <Link href={`/stores/${store.id}`} className="store-card">
                    <span className="store-card-cover">
                      <CatalogImage
                        url={store.coverImageUrl}
                        alt=""
                        fallback={
                          <ImagePlaceholder
                            label={store.name}
                            category={store.category}
                          />
                        }
                      />
                      <span className="store-card-status">
                        <Badge tone={store.isPublished ? "success" : "neutral"}>
                          {store.isPublished
                            ? "Đang hiển thị"
                            : "Chưa hiển thị"}
                        </Badge>
                        {store.isPublished && !store.isAcceptingOrders ? (
                          <Badge tone="warning">Tạm ngưng nhận đơn</Badge>
                        ) : null}
                      </span>
                    </span>
                    <span className="store-card-body">
                      <span className="store-card-logo">
                        <CatalogImage
                          url={store.logoImageUrl}
                          alt=""
                          fallback={
                            <ImagePlaceholder label={store.name} size="sm" />
                          }
                        />
                      </span>
                      <strong className="store-card-name">{store.name}</strong>
                      <span className="small muted">
                        {CATEGORY_LABEL[store.category]} · {store.addressLine}
                      </span>
                      <span className="store-card-stats">
                        <span>
                          <strong className="num">
                            {formatCount(store.availableProductCount)}
                          </strong>
                          <span className="muted">
                            /{formatCount(store.productCount)} món bán
                          </span>
                        </span>
                        <span>
                          <strong className="num">
                            {formatCount(store.activeOrders)}
                          </strong>
                          <span className="muted"> đơn đang xử lý</span>
                        </span>
                        <span>
                          <strong className="num">
                            {formatCompactVnd(store.deliveredValueVnd)}
                          </strong>
                          <span className="muted"> đã giao</span>
                        </span>
                      </span>
                      <span className="small muted store-card-owner">
                        Chủ quán {formatPhone(store.ownerPhone)}
                        {store.applicationId ? " · qua hồ sơ đối tác" : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
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
      <p className="scope-note small muted">
        Quản trị hiện chỉ xem dữ liệu cửa hàng. Ẩn, khóa hoặc sửa cửa hàng sẽ
        được bổ sung ở bước sau.
      </p>
    </>
  );
}
