import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./styles.css";

export const metadata: Metadata = {
  title: "THIGO Admin",
  description: "THIGO administration"
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
