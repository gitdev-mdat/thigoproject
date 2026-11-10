"use client";

import { useState } from "react";

import {
  ROLE_LABEL,
  formatCount,
  formatDate,
  formatPhone,
  formatRelative
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
import type { Role } from "../../types/admin";

type RoleFilter = Role | "ALL";

export default function UsersPage() {
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.replace(/\s+/g, ""));
  const filters = {
    role: role === "ALL" ? undefined : role,
    q: q || undefined,
    page
  };
  const query = useAdminQuery(
    () => adminApi.users(filters),
    JSON.stringify(filters)
  );

  return (
    <>
      <PageHeader
        title="Người dùng"
        description="Tài khoản khách hàng, chủ quán, tài xế và quản trị."
      />
      <Card>
        <div className="toolbar">
          <Segmented<RoleFilter>
            label="Lọc theo vai trò"
            value={role}
            onChange={(value) => {
              setRole(value);
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "Tất cả" },
              { value: "CUSTOMER", label: ROLE_LABEL.CUSTOMER },
              { value: "MERCHANT", label: ROLE_LABEL.MERCHANT },
              { value: "DRIVER", label: ROLE_LABEL.DRIVER },
              { value: "ADMIN", label: ROLE_LABEL.ADMIN }
            ]}
          />
          <div className="toolbar-end">
            <SearchField
              label="Tìm theo số điện thoại"
              placeholder="Số điện thoại, ví dụ 0860"
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
            title="Không có người dùng phù hợp"
            description="Thử chọn vai trò khác hoặc nhập số điện thoại khác."
          />
        ) : (
          <>
            <div className="table-wrap" aria-busy={query.status === "loading"}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Số điện thoại</th>
                    <th scope="col">Vai trò</th>
                    <th scope="col" className="hide-md">
                      Cửa hàng
                    </th>
                    <th scope="col" className="num hide-sm">
                      Đơn đã đặt
                    </th>
                    <th scope="col" className="hide-sm">
                      Đăng nhập gần nhất
                    </th>
                    <th scope="col" className="hide-md">
                      Ngày tạo
                    </th>
                    <th scope="col">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((user) => (
                    <tr key={user.id}>
                      <td className="mono">{formatPhone(user.phone)}</td>
                      <td>
                        <div className="badges">
                          {user.roles.map((item) => (
                            <span key={item} className="chip">
                              {ROLE_LABEL[item]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="hide-md">
                        {user.storeName ??
                          (user.roles.includes("MERCHANT") ? (
                            <span className="muted">Chưa tạo cửa hàng</span>
                          ) : (
                            <span className="muted">—</span>
                          ))}
                      </td>
                      <td className="num hide-sm">
                        {formatCount(user.customerOrders)}
                      </td>
                      <td className="hide-sm muted">
                        {user.lastSignInAt
                          ? formatRelative(user.lastSignInAt)
                          : "Chưa đăng nhập"}
                      </td>
                      <td className="hide-md muted">
                        {formatDate(user.createdAt)}
                      </td>
                      <td>
                        <Badge tone={user.isActive ? "success" : "danger"}>
                          {user.isActive ? "Hoạt động" : "Đã khóa"}
                        </Badge>
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
        Cấp vai trò và khóa tài khoản chưa có trên giao diện quản trị; tài khoản
        chủ quán và tài xế vẫn được cấp theo quy trình F01.
      </p>
    </>
  );
}
