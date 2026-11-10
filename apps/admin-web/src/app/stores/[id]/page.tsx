"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  CATEGORY_LABEL,
  ORDER_STATUS,
  ORDER_STATUS_ORDER,
  formatCompactVnd,
  formatCount,
  formatDate,
  formatPhone,
  formatRelative,
  formatVnd
} from "../../../components/format";
import {
  CatalogImage,
  ImagePlaceholder,
  Journey,
  Lightbox
} from "../../../components/media";
import { partnerJourney } from "../../../components/partners/journey";
import {
  Badge,
  BarList,
  EmptyState,
  ErrorState,
  Icon,
  LoadingRows,
  OrderStatusBadge,
  Segmented
} from "../../../components/ui";
import { useAdminQuery } from "../../../hooks/useAdminQuery";
import { adminApi } from "../../../services/api";
import type {
  AdminProduct,
  AdminStoreDetail,
  ClosedReason
} from "../../../types/admin";

type Tab = "overview" | "menu" | "customer";
type ProductFilter = "all" | "available" | "unavailable" | "archived";

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

const CLOSED_LABEL: Record<ClosedReason, string> = {
  UNPUBLISHED: "Chưa hiển thị với khách",
  PAUSED: "Tạm ngưng nhận đơn",
  OUTSIDE_HOURS: "Ngoài giờ mở cửa"
};

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useAdminQuery(() => adminApi.store(id), id);
  const [tab, setTabState] = useState<Tab>("overview");
  const data = query.data;

  // The tab lives in the URL hash, so a link can open the menu directly.
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (fromHash === "menu" || fromHash === "customer") setTabState(fromHash);
  }, []);
  const setTab = (next: Tab) => {
    setTabState(next);
    window.history.replaceState(
      null,
      "",
      next === "overview" ? " " : `#${next}`
    );
  };

  if (!data)
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

  const { store } = data;
  return (
    <>
      <BackLink />
      <section className="store-hero">
        <div className="store-hero-cover">
          <CatalogImage
            url={store.coverImageUrl}
            alt={`Ảnh bìa ${store.name}`}
            fallback={
              <ImagePlaceholder
                label={store.name}
                category={store.category}
                size="lg"
              />
            }
          />
        </div>
        <div className="store-hero-body">
          <div className="store-hero-logo">
            <CatalogImage
              url={store.logoImageUrl}
              alt={`Logo ${store.name}`}
              fallback={<ImagePlaceholder label={store.name} size="sm" />}
            />
          </div>
          <div className="store-hero-title">
            <div className="badges">
              <Badge tone={store.isOpenNow ? "success" : "neutral"}>
                {store.isOpenNow
                  ? "Khách đang đặt được"
                  : CLOSED_LABEL[store.closedReason ?? "UNPUBLISHED"]}
              </Badge>
              <span className="chip">{CATEGORY_LABEL[store.category]}</span>
            </div>
            <h1>{store.name}</h1>
            <p className="muted">
              {store.addressLine} · cập nhật {formatRelative(store.updatedAt)}
            </p>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>Món đang bán</dt>
              <dd className="num">
                {formatCount(store.availableProductCount)}
                <span className="muted">
                  /{formatCount(store.productCount)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Đơn đang xử lý</dt>
              <dd className="num">{formatCount(store.activeOrders)}</dd>
            </div>
            <div>
              <dt>Đã giao</dt>
              <dd className="num">
                {formatCompactVnd(store.deliveredValueVnd)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="tabs-row">
        <Segmented<Tab>
          label="Phần của cửa hàng"
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Tổng quan" },
            {
              value: "menu",
              label: "Thực đơn",
              count: store.productCount + store.archivedProductCount
            },
            { value: "customer", label: "Khách hàng thấy gì" }
          ]}
        />
        <span className="small muted">
          Chỉ xem · dữ liệu do chủ quán quản lý
        </span>
      </div>

      {tab === "overview" ? <Overview data={data} /> : null}
      {tab === "menu" ? <Menu data={data} /> : null}
      {tab === "customer" ? <CustomerView storeId={store.id} /> : null}
    </>
  );
}

function Overview({ data }: { data: AdminStoreDetail }) {
  const { store, owner, application, orders } = data;
  const journey = application
    ? partnerJourney({
        status: "APPROVED",
        activatedAt: application.activatedAt,
        store: {
          isPublished: store.isPublished,
          availableProductCount: store.availableProductCount
        }
      })
    : null;
  return (
    <div className="review-layout">
      <div className="review-main">
        {journey ? <Journey steps={journey} /> : null}
        <section className="card">
          <div className="card-head">
            <h2>Hồ sơ cửa hàng</h2>
          </div>
          {store.description ? (
            <p className="review-description">{store.description}</p>
          ) : (
            <p className="muted">Chủ quán chưa viết giới thiệu.</p>
          )}
          <div className="info-grid">
            <Info icon="pin" label="Địa chỉ" value={store.addressLine} />
            <Info
              icon="phone"
              label="Điện thoại quán"
              value={store.phone ? formatPhone(store.phone) : "Chưa có"}
            />
            <Info
              icon="user"
              label="Chủ quán"
              value={`${formatPhone(owner.phone)} · từ ${formatDate(owner.since)}`}
            />
            <Info
              icon="clock"
              label="Mở trên THIGO"
              value={formatDate(store.createdAt)}
            />
          </div>
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Giờ mở cửa</h2>
            <Badge tone={store.isAcceptingOrders ? "success" : "warning"}>
              {store.isAcceptingOrders ? "Đang nhận đơn" : "Tạm ngưng nhận đơn"}
            </Badge>
          </div>
          {store.openingHours ? (
            <ul className="hours">
              {DAYS.map((day, index) => {
                const slot = store.openingHours?.[index] ?? null;
                return (
                  <li key={day}>
                    <span>{day}</span>
                    <span className={slot ? "num" : "muted"}>
                      {slot
                        ? `${slot.open} – ${slot.close}${slot.close <= slot.open ? " (hôm sau)" : ""}`
                        : "Nghỉ"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">
              Không giới hạn giờ: khách đặt được bất cứ lúc nào quán đang nhận
              đơn.
            </p>
          )}
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Đơn hàng gần đây</h2>
            <span className="small muted">
              {formatCount(store.deliveredOrders)} đơn đã giao ·{" "}
              {formatVnd(store.deliveredValueVnd)}
            </span>
          </div>
          {orders.recent.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Mã đơn</th>
                    <th scope="col" className="hide-sm">
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
                  {orders.recent.map((order) => (
                    <tr key={order.id}>
                      <td className="mono">{order.code}</td>
                      <td className="hide-sm">
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
            <p className="muted">Cửa hàng chưa có đơn nào.</p>
          )}
        </section>
      </div>
      <aside className="review-side">
        <section className="card">
          <h2>Trạng thái đơn</h2>
          <BarList
            items={ORDER_STATUS_ORDER.filter(
              (status) => orders.byStatus[status] > 0
            ).map((status) => ({
              key: status,
              label: ORDER_STATUS[status].label,
              value: orders.byStatus[status],
              tone: ORDER_STATUS[status].tone
            }))}
          />
          {ORDER_STATUS_ORDER.every((status) => !orders.byStatus[status]) ? (
            <p className="muted small">Chưa có đơn.</p>
          ) : null}
        </section>
        {application ? (
          <Link
            href={`/partners/${application.id}`}
            className="store-link-card"
          >
            <span className="info-icon" aria-hidden="true">
              <Icon name="partners" size={18} />
            </span>
            <div>
              <span className="small muted">Hồ sơ đối tác</span>
              <strong>{application.code}</strong>
              <span className="small muted">
                {application.source === "ADMIN" ? "THIGO thêm" : "Tự đăng ký"}
                {application.activatedAt
                  ? ` · kích hoạt ${formatDate(application.activatedAt)}`
                  : ""}
              </span>
            </div>
            <Icon name="chevronRight" size={18} />
          </Link>
        ) : (
          <section className="card">
            <h2>Nguồn tài khoản</h2>
            <p className="muted small">
              Tài khoản chủ quán được cấp trước quy trình hồ sơ đối tác (dữ liệu
              mẫu hoặc cấp trực tiếp theo F01).
            </p>
          </section>
        )}
      </aside>
    </div>
  );
}

function Menu({ data }: { data: AdminStoreDetail }) {
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [selected, setSelected] = useState<AdminProduct>();
  const live = data.categories.flatMap((category) => category.products);
  const counts = {
    all: live.length + data.archivedProducts.length,
    available: live.filter((product) => product.isAvailable).length,
    unavailable: live.filter((product) => !product.isAvailable).length,
    archived: data.archivedProducts.length
  };
  const sections = useMemo(() => {
    if (filter === "archived")
      return data.archivedProducts.length
        ? [
            {
              id: "archived",
              name: "Đã lưu trữ",
              isActive: false,
              products: data.archivedProducts
            }
          ]
        : [];
    const groups = data.categories.map((category) => ({
      ...category,
      products: category.products.filter((product) =>
        filter === "available"
          ? product.isAvailable
          : filter === "unavailable"
            ? !product.isAvailable
            : true
      )
    }));
    const visible =
      filter === "all" ? groups : groups.filter((g) => g.products.length);
    return filter === "all" && data.archivedProducts.length
      ? [
          ...visible,
          {
            id: "archived",
            name: "Đã lưu trữ",
            isActive: false,
            products: data.archivedProducts
          }
        ]
      : visible;
  }, [data, filter]);
  const categoryName = (id: string) =>
    data.categories.find((category) => category.id === id)?.name ?? "—";

  if (!data.categories.length && !data.archivedProducts.length)
    return (
      <section className="card">
        <EmptyState
          title="Cửa hàng chưa có thực đơn"
          description="Chủ quán chưa tạo danh mục hay món nào. Thực đơn sẽ hiện ở đây ngay khi chủ quán thêm."
        />
      </section>
    );

  return (
    <>
      <div className="toolbar">
        <Segmented<ProductFilter>
          label="Lọc món"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Tất cả", count: counts.all },
            { value: "available", label: "Đang bán", count: counts.available },
            {
              value: "unavailable",
              label: "Tạm hết",
              count: counts.unavailable
            },
            { value: "archived", label: "Đã lưu trữ", count: counts.archived }
          ]}
        />
        <span className="small muted">
          {data.categories.length} danh mục · giá lấy từ cơ sở dữ liệu
        </span>
      </div>
      {sections.length ? (
        sections.map((section) => (
          <section key={section.id} className="menu-section">
            <div className="menu-section-head">
              <h2>{section.name}</h2>
              {section.id !== "archived" && !section.isActive ? (
                <Badge tone="neutral">Danh mục đang ẩn</Badge>
              ) : null}
              <span className="small muted">{section.products.length} món</span>
            </div>
            {section.products.length ? (
              <ul className="product-grid">
                {section.products.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      className={`product-card${product.archivedAt ? " is-archived" : !product.isAvailable ? " is-unavailable" : ""}`}
                      onClick={() => setSelected(product)}
                    >
                      <span className="product-image">
                        <CatalogImage
                          url={product.imageUrl}
                          alt=""
                          fallback={
                            <ImagePlaceholder label={product.name} size="sm" />
                          }
                        />
                        <span className="product-state">
                          <ProductBadge product={product} />
                        </span>
                      </span>
                      <span className="product-body">
                        <strong>{product.name}</strong>
                        {product.description ? (
                          <span className="product-description small muted">
                            {product.description}
                          </span>
                        ) : null}
                        <span className="product-foot">
                          <span className="num product-price">
                            {formatVnd(product.priceVnd)}
                          </span>
                          {product.optionGroups.length ? (
                            <span className="small muted">
                              {product.optionGroups.length} nhóm tùy chọn
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">Danh mục chưa có món.</p>
            )}
          </section>
        ))
      ) : (
        <section className="card">
          <EmptyState
            title="Không có món nào ở trạng thái này"
            description="Chọn bộ lọc khác để xem toàn bộ thực đơn."
          />
        </section>
      )}
      {selected ? (
        <Lightbox
          title={selected.name}
          onClose={() => setSelected(undefined)}
          caption={
            <div className="product-detail">
              <div className="badges">
                <ProductBadge product={selected} />
                <span className="chip">
                  {selected.archivedAt
                    ? `Từng thuộc ${categoryName(selected.categoryId)}`
                    : categoryName(selected.categoryId)}
                </span>
              </div>
              <p className="product-detail-price num">
                {formatVnd(selected.priceVnd)}
              </p>
              {selected.description ? <p>{selected.description}</p> : null}
              {selected.optionGroups.map((group) => (
                <div key={group.name} className="option-group">
                  <strong>
                    {group.name}{" "}
                    <span className="small muted">
                      {group.minSelect > 0
                        ? `bắt buộc chọn ${group.minSelect}`
                        : `chọn tối đa ${group.maxSelect}`}
                    </span>
                  </strong>
                  <ul>
                    {group.options.map((option) => (
                      <li key={option.name}>
                        <span className={option.isAvailable ? "" : "muted"}>
                          {option.name}
                          {option.isAvailable ? "" : " (hết)"}
                        </span>
                        <span className="num muted">
                          {option.priceDeltaVnd
                            ? `+${formatVnd(option.priceDeltaVnd)}`
                            : "Miễn phí"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="small muted">
                Đã bán {formatCount(selected.orderedQuantity)} phần · cập nhật{" "}
                {formatRelative(selected.updatedAt)}
                {selected.archivedAt
                  ? ` · lưu trữ ${formatRelative(selected.archivedAt)}`
                  : ""}
              </p>
            </div>
          }
        >
          <CatalogImage
            url={selected.imageUrl}
            alt={selected.name}
            fallback={<ImagePlaceholder label={selected.name} size="lg" />}
          />
        </Lightbox>
      ) : null}
    </>
  );
}

function ProductBadge({ product }: { product: AdminProduct }) {
  if (product.archivedAt) return <Badge tone="neutral">Đã lưu trữ</Badge>;
  if (!product.isAvailable) return <Badge tone="warning">Tạm hết</Badge>;
  return <Badge tone="success">Đang bán</Badge>;
}

/** Built from the customer catalog service itself, so it cannot drift. */
function CustomerView({ storeId }: { storeId: string }) {
  const query = useAdminQuery(
    () => adminApi.storeCustomerView(storeId),
    `customer-${storeId}`
  );
  if (query.status === "error")
    return (
      <section className="card">
        <ErrorState
          message={query.message}
          onRetry={() => void query.reload()}
        />
      </section>
    );
  if (!query.data)
    return (
      <section className="card">
        <LoadingRows />
      </section>
    );
  const view = query.data;
  if (!view.visible || !view.store)
    return (
      <section className="card">
        <EmptyState
          title="Khách hàng chưa thấy cửa hàng này"
          description="Cửa hàng chưa bật hiển thị. Khi chủ quán mở bán, đây sẽ là đúng những gì khách thấy trong ứng dụng."
        />
      </section>
    );
  const store = view.store;
  return (
    <div className="customer-preview-layout">
      <div
        className="phone-frame"
        aria-label="Xem trước trong ứng dụng khách hàng"
      >
        <div className="phone-cover">
          <CatalogImage
            url={store.coverImageUrl}
            alt=""
            fallback={<ImagePlaceholder label={store.name} size="lg" />}
          />
        </div>
        <div className="phone-body">
          <div className="phone-store">
            <span className="phone-logo">
              <CatalogImage
                url={store.logoImageUrl}
                alt=""
                fallback={<ImagePlaceholder label={store.name} size="sm" />}
              />
            </span>
            <div>
              <strong>{store.name}</strong>
              <span className="small muted">{store.addressLine}</span>
            </div>
          </div>
          {!store.isOpen && store.closedReason ? (
            <p className="notice notice-info small">
              {CLOSED_LABEL[store.closedReason]}
            </p>
          ) : null}
          {store.categories.map((category) => (
            <div key={category.id} className="phone-category">
              <strong>{category.name}</strong>
              {category.products.map((product) => (
                <div key={product.id} className="phone-product">
                  <div>
                    <span className={product.isAvailable ? "" : "muted"}>
                      {product.name}
                    </span>
                    {product.description ? (
                      <span className="small muted phone-product-description">
                        {product.description}
                      </span>
                    ) : null}
                    <span className="num small">
                      {product.isAvailable
                        ? formatVnd(product.priceVnd)
                        : "Hết món"}
                    </span>
                  </div>
                  <span className="phone-product-image">
                    <CatalogImage
                      url={product.imageUrl}
                      alt=""
                      fallback={
                        <ImagePlaceholder label={product.name} size="sm" />
                      }
                    />
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <section className="card">
        <h2>Vì sao khách thấy như vậy</h2>
        <p className="muted small">
          Bản xem trước lấy từ chính dịch vụ thực đơn của ứng dụng khách hàng.
          Khách chỉ thấy danh mục đang bật và còn món; món đã lưu trữ không
          hiện; món tạm hết hiện “Hết món” và không đặt được.
        </p>
        <dl className="facts">
          <div>
            <dt>Danh mục khách thấy</dt>
            <dd className="num">{store.categories.length}</dd>
          </div>
          <div>
            <dt>Món khách thấy</dt>
            <dd className="num">
              {store.categories.reduce((sum, c) => sum + c.products.length, 0)}
            </dd>
          </div>
          <div>
            <dt>Đặt được ngay</dt>
            <dd>{store.isOpen ? "Có" : "Không"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function Info({
  icon,
  label,
  value
}: {
  icon: "pin" | "phone" | "user" | "clock";
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
    <Link href="/stores" className="back-link">
      <Icon name="back" size={16} />
      Danh sách cửa hàng
    </Link>
  );
}
