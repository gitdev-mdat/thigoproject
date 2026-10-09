"use client";

import { useState } from "react";

import {
  CATEGORY_LABEL,
  formatCount,
  formatPhone,
  formatVnd
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
            <div className="table-wrap" aria-busy={query.status === "loading"}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Cửa hàng</th>
                    <th scope="col" className="hide-sm">
                      Loại
                    </th>
                    <th scope="col" className="hide-md">
                      Chủ quán
                    </th>
                    <th scope="col" className="num">
                      Món đang bán
                    </th>
                    <th scope="col" className="num">
                      Đang xử lý
                    </th>
                    <th scope="col" className="num hide-sm">
                      Đã giao
                    </th>
                    <th scope="col">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((store) => (
                    <tr key={store.id}>
                      <td>
                        <strong>{store.name}</strong>
                        <span className="cell-sub">{store.addressLine}</span>
                      </td>
                      <td className="hide-sm">
                        {CATEGORY_LABEL[store.category]}
                      </td>
                      <td className="hide-md">
                        {formatPhone(store.ownerPhone)}
                        {store.phone ? (
                          <span className="cell-sub">
                            Liên hệ quán: {formatPhone(store.phone)}
                          </span>
                        ) : (
                          <span className="cell-sub">
                            Quán chưa có số liên hệ
                          </span>
                        )}
                      </td>
                      <td className="num">
                        {formatCount(store.availableProductCount)}
                        <span className="cell-sub">
                          trên {formatCount(store.productCount)} món
                        </span>
                      </td>
                      <td className="num">{formatCount(store.activeOrders)}</td>
                      <td className="num hide-sm">
                        {formatCount(store.deliveredOrders)}
                        <span className="cell-sub">
                          {formatVnd(store.deliveredValueVnd)}
                        </span>
                      </td>
                      <td>
                        <div className="badges">
                          <Badge
                            tone={store.isPublished ? "success" : "neutral"}
                          >
                            {store.isPublished
                              ? "Đang hiển thị"
                              : "Chưa hiển thị"}
                          </Badge>
                          {store.isPublished ? (
                            <Badge
                              tone={
                                store.isAcceptingOrders ? "info" : "warning"
                              }
                            >
                              {store.isAcceptingOrders
                                ? "Nhận đơn"
                                : "Tạm ngưng nhận đơn"}
                            </Badge>
                          ) : null}
                        </div>
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
      <p className="scope-note small muted">
        Quản trị hiện chỉ xem dữ liệu cửa hàng. Ẩn, khóa hoặc sửa cửa hàng sẽ
        được bổ sung ở bước sau.
      </p>
    </>
  );
}
