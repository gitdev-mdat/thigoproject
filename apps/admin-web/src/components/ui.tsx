"use client";

import type { ReactNode } from "react";

import { ORDER_STATUS, formatCount, type Tone } from "./format";
import type { OrderStatus } from "../types/admin";

const ICONS = {
  overview: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
  stores:
    "M4 4h16l1 5a3 3 0 0 1-5 2 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-5-2l1-5Zm1 9v7h14v-7M9 20v-4h6v4",
  orders: "M7 3h10l2 3v15H5V6l2-3Zm-2 3h14M9 10h6M9 14h6M9 18h3",
  users:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 9a6 6 0 0 1 12 0M16 4a4 4 0 0 1 0 7m5 9a6 6 0 0 0-3-5",
  drivers:
    "M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM3 17V7h11v10M14 10h4l3 4v3h-2M9 17h6",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.4 7.4 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.4 7.4 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4",
  bolt: "M13 3 5 14h6l-1 7 8-11h-6l1-7Z",
  alert:
    "M12 9v4m0 4h.01M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z",
  arrowUp: "M12 19V5m-6 6 6-6 6 6",
  arrowDown: "M12 5v14m6-6-6 6-6-6",
  chevronLeft: "m15 6-6 6 6 6",
  chevronRight: "m9 6 6 6-6 6"
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className = ""
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title ? (
        <div className="card-head">
          <div>
            <h2>{title}</h2>
            {description ? <p className="muted small">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  detail,
  icon,
  trend
}: {
  label: string;
  value: string;
  detail: ReactNode;
  icon: IconName;
  trend?: { direction: "up" | "down" | "flat"; text: string };
}) {
  return (
    <section className="stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-detail">
        {trend ? (
          <span className={`trend trend-${trend.direction}`}>
            {trend.direction !== "flat" ? (
              <Icon
                name={trend.direction === "up" ? "arrowUp" : "arrowDown"}
                size={14}
              />
            ) : null}
            {trend.text}
          </span>
        ) : null}
        <span>{detail}</span>
      </p>
    </section>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>Đang tải dữ liệu…</span>
      <span className="sr-only">{rows} dòng</span>
    </div>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="state">
      <strong>{title}</strong>
      <span className="muted">{description}</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="state state-error" role="alert">
      <Icon name="alert" />
      <strong>{message}</strong>
      <button className="button secondary" type="button" onClick={onRetry}>
        <Icon name="refresh" size={16} />
        Thử lại
      </button>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(total, page * pageSize);
  return (
    <nav className="pagination" aria-label="Phân trang">
      <span className="muted small">
        {formatCount(first)}–{formatCount(last)} trên {formatCount(total)}
      </span>
      <div className="pagination-buttons">
        <button
          className="button icon"
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Trang trước"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <span className="small">
          Trang {page}/{pages}
        </span>
        <button
          className="button icon"
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Trang sau"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>
    </nav>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={option.value === value ? "selected" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined ? (
            <span className="segmented-count">{formatCount(option.count)}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search">
      <span className="sr-only">{label}</span>
      <Icon name="search" size={18} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        maxLength={80}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

/** Proportional horizontal bars; every value is a real count. */
export function BarList({
  items
}: {
  items: { key: string; label: ReactNode; value: number; tone?: Tone }[];
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="bar-list">
      {items.map((item) => (
        <li key={item.key}>
          <div className="bar-list-label">
            <span>{item.label}</span>
            <strong className="num">{formatCount(item.value)}</strong>
          </div>
          <div className="bar-track" aria-hidden="true">
            <span
              className={`bar-fill tone-${item.tone ?? "brand"}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
