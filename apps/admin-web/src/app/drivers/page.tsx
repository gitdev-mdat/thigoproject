"use client";

import { useState } from "react";

import {
  formatCount,
  formatPhone,
  formatRelative,
  formatVnd
} from "../../components/format";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingRows,
  OrderStatusBadge,
  PageHeader,
  Pagination
} from "../../components/ui";
import { useAdminQuery } from "../../hooks/useAdminQuery";
import { adminApi } from "../../services/api";

export default function DriversPage() {
  const [page, setPage] = useState(1);
  const query = useAdminQuery(() => adminApi.drivers({ page }), `p${page}`);
  const items = query.data?.items ?? [];
  const busy = items.filter((driver) => driver.currentOrder).length;

  return (
    <>
      <PageHeader
        title="Tài xế"
        description="Ai đang giao đơn nào, và kết quả giao hàng của từng tài xế."
      />
      <Card>
        {query.status === "error" ? (
          <ErrorState
            message={query.message}
            onRetry={() => void query.reload()}
          />
        ) : !query.data ? (
          <LoadingRows />
        ) : !items.length ? (
          <EmptyState
            title="Chưa có tài xế"
            description="Tài khoản tài xế được cấp theo quy trình F01."
          />
        ) : (
          <>
            <p className="small muted table-caption">
              Trang này có {formatCount(busy)} tài xế đang giữ đơn và{" "}
              {formatCount(items.length - busy)} tài xế đang rảnh.
            </p>
            <div className="table-wrap" aria-busy={query.status === "loading"}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Tài xế</th>
                    <th scope="col">Đơn đang giữ</th>
                    <th scope="col" className="num">
                      Đã giao
                    </th>
                    <th scope="col" className="num hide-sm">
                      Giá trị đã giao
                    </th>
                    <th scope="col" className="hide-md">
                      Lần giao gần nhất
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((driver) => (
                    <tr key={driver.id}>
                      <td>
                        <span className="mono">
                          {formatPhone(driver.phone)}
                        </span>
                        {!driver.isActive ? (
                          <Badge tone="danger">Đã khóa</Badge>
                        ) : null}
                      </td>
                      <td>
                        {driver.currentOrder ? (
                          <div className="current-order">
                            <span>
                              <span className="mono">
                                {driver.currentOrder.code}
                              </span>{" "}
                              · {driver.currentOrder.storeName}
                            </span>
                            <OrderStatusBadge
                              status={driver.currentOrder.status}
                            />
                          </div>
                        ) : (
                          <Badge tone="neutral">Đang rảnh</Badge>
                        )}
                      </td>
                      <td className="num">
                        {formatCount(driver.deliveredCount)}
                      </td>
                      <td className="num hide-sm">
                        {formatVnd(driver.deliveredValueVnd)}
                      </td>
                      <td className="hide-md muted">
                        {driver.lastDeliveredAt
                          ? formatRelative(driver.lastDeliveredAt)
                          : "Chưa giao đơn nào"}
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
