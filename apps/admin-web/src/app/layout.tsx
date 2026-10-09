import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminShell } from "../components/shell/AdminShell";
import { AdminSessionProvider } from "../hooks/useAdminSession";
import "./styles.css";

export const metadata: Metadata = {
  title: "THIGO Quản trị",
  description: "Theo dõi cửa hàng, đơn hàng và tài xế THIGO"
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <html lang="vi">
      <body>
        <AdminSessionProvider>
          <AdminShell>{children}</AdminShell>
        </AdminSessionProvider>
      </body>
    </html>
  );
}
