import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "命理核對 · Mingli Verify",
  description:
    "私隱優先嘅命理顧問核對工具：八字、紫微、西洋、人類圖、六爻、姓名。唔儲存個人資料。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <body className="min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
