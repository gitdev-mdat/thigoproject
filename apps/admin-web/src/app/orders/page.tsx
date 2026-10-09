"use client";

import { useState } from "react";

import {
  ORDER_STATUS,
  ORDER_STATUS_ORDER,
  formatCount,
  formatDateTime,
  formatPhone,
  formatVnd
} from "../../components/format";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingRows,
  OrderStatusBadge,
  PageHeader,
  Pagination,
  SearchField
} from "../../components/ui";
import { useAdminQuery } from "../../hooks/useAdminQuery";
import { useDebounced } from "../../hooks/useDebounced";
import { adminApi } from "../../services/api";
import type { OrderStatus } from "../../types/admin";

export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());
  const filters = { status: status || undefined, q: q || undefined, page };
  const query = useAdminQuery(
    () => adminApi.orders(filters),
    JSON.stringify(filters)
  );

  return (
    <>
      <PageHeader
        title="Đơn hàng"
        description="Toàn bộ đơn trên THIGO, mới nhất trước."
      />
      <Card>
        <div className="toolbar">
          <label className="select">
            <span className="sr-only">Trạng thái đơn</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as OrderStatus | "");
                setPage(1);
              }}
            >
              <option value="">Mọi trạng thái</option>
              {ORDER_STATUS_ORDER.map((key) => (
                <option key={key} value={key}>
                  {ORDER_STATUS[key].label}
                </option>
              ))}
            </select>
          </label>
          <div className="toolbar-end">
            <SearchField
              label="Tìm đơn hàng"
              placeholder="Mã đơn, cửa hàng hoặc số điện thoại"
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
            title="Không có đơn phù hợp"
            description="Thử chọn trạng thái khác hoặc đổi từ khóa tìm kiếm."
          />
        ) : (
          <>
            <div className="table-wrap" aria-busy={query.status === "loading"}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Mã đơn</th>
                    <th scope="col">Cửa hàng</th>
                    <th scope="col" className="hide-md">
                      Khách hàng
                    </th>
                    <th scope="col" className="hide-md">
                      Tài xế
                    </th>
                    <th scope="col" className="num hide-sm">
                      Số món
                    </th>
                    <th scope="col" className="num">
                      Tổng tiền
                    </th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col" className="hide-sm">
                      Đặt lúc
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((order) => (
                    <tr key={order.id}>
                      <td className="mono">{order.code}</td>
                      <td>{order.store.name}</td>
                      <td className="hide-md">
                        {formatPhone(order.customerPhone)}
                      </td>
                      <td className="hide-md">
                        {order.driverPhone ? (
                          formatPhone(order.driverPhone)
                        ) : (
                          <span className="muted">Chưa có</span>
                        )}
                      </td>
                      <td className="num hide-sm">
                        {formatCount(order.itemCount)}
                      </td>
                      <td className="num">{formatVnd(order.totalVnd)}</td>
                      <td>
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="hide-sm muted">
                        {formatDateTime(order.placedAt)}
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
        Quản trị hiện chỉ theo dõi đơn. Can thiệp vào đơn (hủy, đổi tài xế) sẽ
        được bổ sung ở bước sau.
      </p>
    </>
  );
}
