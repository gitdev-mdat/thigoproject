"use client";

import { useState } from "react";

import { formatPhone } from "../../components/format";
import { Badge, Card, Icon, PageHeader } from "../../components/ui";
import { useAdminSession } from "../../hooks/useAdminSession";
import { apiBaseUrl } from "../../services/api";

export default function SettingsPage() {
  const session = useAdminSession();
  const [signingOut, setSigningOut] = useState(false);
  return (
    <>
      <PageHeader
        title="Cài đặt"
        description="Tài khoản đang đăng nhập và môi trường đang kết nối."
      />
      <div className="grid-2">
        <Card title="Tài khoản">
          <dl className="facts">
            <div>
              <dt>Số điện thoại</dt>
              <dd className="mono">
                {formatPhone(session.user?.phone ?? null)}
              </dd>
            </div>
            <div>
              <dt>Vai trò</dt>
              <dd>
                <div className="badges">
                  {session.user?.roles.map((role) => (
                    <span key={role} className="chip">
                      {role === "ADMIN" ? "Quản trị" : role}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
            <div>
              <dt>Phiên đăng nhập</dt>
              <dd>Lưu trong cookie bảo mật của trình duyệt</dd>
            </div>
          </dl>
          <button
            type="button"
            className="button secondary"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              void session.signOut().finally(() => setSigningOut(false));
            }}
          >
            <Icon name="logout" size={16} />
            {signingOut ? "Đang đăng xuất…" : "Đăng xuất khỏi THIGO"}
          </button>
        </Card>
        <Card title="Môi trường">
          <dl className="facts">
            <div>
              <dt>API</dt>
              <dd className="mono">{apiBaseUrl}</dd>
            </div>
            <div>
              <dt>Đăng nhập nhanh (DEV)</dt>
              <dd>
                {session.quickLogin ? (
                  <Badge tone="warning">Đang bật trên API này</Badge>
                ) : (
                  <Badge tone="neutral">Tắt</Badge>
                )}
              </dd>
            </div>
          </dl>
          <p className="small muted">
            Đăng nhập nhanh chỉ bật khi API chạy với NODE_ENV=development,
            THIGO_ENABLE_DEV_FIXTURES=true và OTP_PROVIDER=test. Môi trường
            production từ chối khởi động với các cài đặt này.
          </p>
        </Card>
        <Card title="Phạm vi hiện tại" className="span-2-wide">
          <p>
            Giao diện quản trị đang ở chế độ chỉ xem: mọi số liệu được đọc trực
            tiếp từ API và PostgreSQL. Các thao tác thay đổi như ẩn cửa hàng,
            khóa tài khoản hay can thiệp đơn hàng chưa được mở và sẽ có xác nhận
            rõ ràng khi được bổ sung.
          </p>
        </Card>
      </div>
    </>
  );
}
