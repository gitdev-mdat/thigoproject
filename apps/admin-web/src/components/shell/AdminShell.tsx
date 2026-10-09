"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useAdminSession } from "../../hooks/useAdminSession";
import { AdminLogin } from "../auth/AdminLogin";
import { formatPhone } from "../format";
import { Icon, type IconName } from "../ui";

const NAVIGATION: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Tổng quan", icon: "overview" },
  { href: "/stores", label: "Cửa hàng", icon: "stores" },
  { href: "/orders", label: "Đơn hàng", icon: "orders" },
  { href: "/users", label: "Người dùng", icon: "users" },
  { href: "/drivers", label: "Tài xế", icon: "drivers" },
  { href: "/settings", label: "Cài đặt", icon: "settings" }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const session = useAdminSession();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  if (session.state === "restoring")
    return (
      <main className="splash" aria-busy="true">
        <span className="brand-mark large">T</span>
        <p className="muted">Đang kiểm tra phiên đăng nhập…</p>
      </main>
    );
  if (session.state === "anonymous") return <AdminLogin />;

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/" className="brand-row sidebar-brand">
          <span className="brand-mark">T</span>
          <span className="brand-name">THIGO</span>
          <span className="chip">Quản trị</span>
        </Link>
        <nav aria-label="Điều hướng chính">
          <ul className="nav">
            {NAVIGATION.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={active(item.href) ? "nav-link active" : "nav-link"}
                  aria-current={active(item.href) ? "page" : undefined}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="sidebar-foot small">
          Dữ liệu đọc trực tiếp từ API THIGO.
        </p>
      </aside>
      <div className="workspace">
        <header className="topbar">
          {session.quickLogin ? (
            <span className="topbar-env">
              <span className="dev-tag">DEV</span>
              <span className="small muted">Môi trường phát triển cục bộ</span>
            </span>
          ) : (
            <span />
          )}
          <div className="account">
            <span className="avatar" aria-hidden="true">
              QT
            </span>
            <span className="account-text">
              <strong>{formatPhone(session.user?.phone ?? null)}</strong>
              <span className="small muted">Quản trị viên</span>
            </span>
            <button
              type="button"
              className="button secondary compact"
              disabled={signingOut}
              onClick={() => {
                setSigningOut(true);
                void session.signOut().finally(() => setSigningOut(false));
              }}
            >
              <Icon name="logout" size={16} />
              {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
