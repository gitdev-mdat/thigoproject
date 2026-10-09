"use client";

import Link from "next/link";

import { DailyOrdersChart } from "../components/dashboard/DailyOrdersChart";
import {
  CATEGORY_LABEL,
  ORDER_STATUS,
  ORDER_STATUS_ORDER,
  ROLE_LABEL,
  formatCompactVnd,
  formatCount,
  formatDateTime,
  formatPhone,
  formatRelative,
  formatVnd
} from "../components/format";
import {
  BarList,
  Card,
  ErrorState,
  Icon,
  LoadingRows,
  OrderStatusBadge,
  PageHeader,
  StatTile
} from "../components/ui";
import { useAdminQuery } from "../hooks/useAdminQuery";
import { adminApi } from "../services/api";
import type { AdminOverview, Role } from "../types/admin";

function trend(current: number, previous: number) {
  if (!previous)
    return current
      ? { direction: "up" as const, text: "Mới trong 7 ngày" }
      : { direction: "flat" as const, text: "Chưa có đơn" };
  const change = Math.round(((current - previous) / previous) * 100);
  return {
    direction:
      change > 0
        ? ("up" as const)
        : change < 0
          ? ("down" as const)
          : ("flat" as const),
    text: `${change > 0 ? "+" : ""}${change}% so với 7 ngày trước`
  };
}

export default function OverviewPage() {
  const query = useAdminQuery(adminApi.overview, "overview");
  const data = query.data;
  return (
    <>
      <PageHeader
        title="Tổng quan"
        description={
          data
            ? `Cập nhật lúc ${formatDateTime(data.generatedAt)} · giờ Việt Nam`
            : "Tình hình vận hành THIGO từ dữ liệu thật trong PostgreSQL."
        }
        actions={
          <button
            type="button"
            className="button secondary compact"
            onClick={() => void query.reload()}
            disabled={query.status === "loading"}
          >
            <Icon name="refresh" size={16} />
            {query.status === "loading" ? "Đang tải…" : "Làm mới"}
          </button>
        }
      />
      {query.status === "error" && !data ? (
        <Card>
          <ErrorState
            message={query.message}
            onRetry={() => void query.reload()}
          />
        </Card>
      ) : !data ? (
        <Card>
          <LoadingRows />
        </Card>
      ) : (
        <Overview data={data} />
      )}
    </>
  );
}

function Overview({ data }: { data: AdminOverview }) {
  const week = data.delivered.last7Days;
  const attention = [
    data.partners.pendingReview
      ? {
          key: "partners",
          text: `${data.partners.pendingReview} hồ sơ đối tác đang chờ duyệt`,
          href: "/partners"
        }
      : null,
    data.orders.byStatus.PENDING
      ? {
          key: "pending",
          text: `${data.orders.byStatus.PENDING} đơn đang chờ quán xác nhận`,
          href: "/orders"
        }
      : null,
    data.orders.byStatus.READY_FOR_PICKUP
      ? {
          key: "ready",
          text: `${data.orders.byStatus.READY_FOR_PICKUP} đơn đã xong, chờ tài xế lấy`,
          href: "/orders"
        }
      : null,
    data.stores.hidden
      ? {
          key: "hidden",
          text: `${data.stores.hidden} cửa hàng chưa hiển thị với khách`,
          href: "/stores"
        }
      : null,
    data.stores.merchantsWithoutStore
      ? {
          key: "no-store",
          text: `${data.stores.merchantsWithoutStore} chủ quán chưa tạo cửa hàng`,
          href: "/users"
        }
      : null
  ].filter((item) => item !== null);

  return (
    <div className="overview">
      <div className="stats">
        <StatTile
          label="Đơn đang xử lý"
          value={formatCount(data.orders.active)}
          icon="orders"
          detail={`${formatCount(data.orders.placedLast24Hours)} đơn đặt trong 24 giờ`}
        />
        <StatTile
          label="Giá trị đơn đã giao · 7 ngày"
          value={formatCompactVnd(week.valueVnd)}
          icon="overview"
          trend={trend(week.valueVnd, data.delivered.previous7Days.valueVnd)}
          detail={`${formatCount(week.orders)} đơn, trung bình ${formatCompactVnd(week.averageVnd)}`}
        />
        <StatTile
          label="Cửa hàng đang hiển thị"
          value={`${formatCount(data.stores.published)}/${formatCount(data.stores.total)}`}
          icon="stores"
          detail={`${formatCount(data.stores.acceptingOrders)} đang nhận đơn`}
        />
        <StatTile
          label="Tài xế đang giao"
          value={`${formatCount(data.drivers.onDelivery)}/${formatCount(data.drivers.total)}`}
          icon="drivers"
          detail={`${formatCount(data.drivers.idle)} tài xế đang rảnh`}
        />
      </div>

      <div className="grid-main">
        <Card
          title="Đơn hàng 14 ngày qua"
          description="Theo ngày đặt và ngày giao, giờ Việt Nam."
          className="span-2"
        >
          <DailyOrdersChart days={data.daily} />
        </Card>
        <Card title="Cần chú ý" description="Những việc đang chờ người xử lý.">
          {attention.length ? (
            <ul className="attention">
              {attention.map((item) => (
                <li key={item.key}>
                  <Icon name="alert" size={18} />
                  <Link href={item.href}>{item.text}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Không có việc nào đang chờ.</p>
          )}
          <div className="divider" />
          <h3 className="mini-title">Trạng thái đơn</h3>
          <BarList
            items={ORDER_STATUS_ORDER.map((status) => ({
              key: status,
              label: ORDER_STATUS[status].label,
              value: data.orders.byStatus[status],
              tone: ORDER_STATUS[status].tone
            }))}
          />
        </Card>
      </div>

      <div className="grid-main">
        <Card
          title="Đơn hàng gần đây"
          className="span-2"
          action={
            <Link className="link small" href="/orders">
              Xem tất cả đơn
            </Link>
          }
        >
          {data.recentOrders.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Mã đơn</th>
                    <th scope="col">Cửa hàng</th>
                    <th scope="col" className="hide-md">
                      Khách hàng
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
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="mono">{order.code}</td>
                      <td>{order.store.name}</td>
                      <td className="hide-md">
                        {formatPhone(order.customerPhone)}
                      </td>
                      <td className="num">{formatVnd(order.totalVnd)}</td>
                      <td>
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="hide-sm muted">
                        {formatRelative(order.placedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Chưa có đơn hàng nào.</p>
          )}
        </Card>
        <Card
          title="Cửa hàng giao nhiều nhất"
          description="Theo giá trị đơn đã giao."
          action={
            <Link className="link small" href="/stores">
              Xem cửa hàng
            </Link>
          }
        >
          {data.topStores.length ? (
            <ol className="ranking">
              {data.topStores.map((store, index) => (
                <li key={store.id}>
                  <span className="rank">{index + 1}</span>
                  <span className="ranking-name">
                    <strong>{store.name}</strong>
                    <span className="small muted">
                      {CATEGORY_LABEL[store.category]} ·{" "}
                      {formatCount(store.deliveredOrders)} đơn
                    </span>
                  </span>
                  <span className="num">
                    {formatCompactVnd(store.deliveredValueVnd)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Chưa có đơn nào được giao.</p>
          )}
        </Card>
      </div>

      <div className="grid-3">
        <Card
          title="Người dùng"
          description={`${formatCount(data.users.total)} tài khoản · ${formatCount(data.users.newLast7Days)} mới trong 7 ngày`}
        >
          <BarList
            items={(["CUSTOMER", "MERCHANT", "DRIVER", "ADMIN"] as Role[]).map(
              (role) => ({
                key: role,
                label: ROLE_LABEL[role],
                value: data.users.byRole[role]
              })
            )}
          />
        </Card>
        <Card
          title="Cửa hàng theo loại"
          description={`${formatCount(data.stores.total)} cửa hàng`}
        >
          <BarList
            items={(["FOOD", "COFFEE", "MILK_TEA"] as const).map(
              (category) => ({
                key: category,
                label: CATEGORY_LABEL[category],
                value: data.stores.byCategory[category]
              })
            )}
          />
        </Card>
        <Card title="Thực đơn" description="Món đang bán trên toàn hệ thống.">
          <dl className="facts">
            <div>
              <dt>Món đang bán</dt>
              <dd className="num">
                {formatCount(data.catalog.availableProducts)}
              </dd>
            </div>
            <div>
              <dt>Món tạm hết</dt>
              <dd className="num">
                {formatCount(
                  data.catalog.products - data.catalog.availableProducts
                )}
              </dd>
            </div>
            <div>
              <dt>Danh mục</dt>
              <dd className="num">{formatCount(data.catalog.categories)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
