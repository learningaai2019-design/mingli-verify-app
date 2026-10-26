"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIVACY_COPY } from "@/lib/shared/privacy";

const NAV = [
  { href: "/", label: "首頁" },
  { href: "/bazi", label: "八字" },
  { href: "/ziwei", label: "紫微" },
  { href: "/western", label: "西洋" },
  { href: "/humandesign", label: "人類圖" },
  { href: "/liuyao", label: "六爻" },
  { href: "/name", label: "姓名" },
  { href: "/privacy", label: "私隱" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--bdr)] backdrop-blur-md bg-[rgba(2,8,16,0.85)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <Link href="/" className="font-semibold tracking-wide text-[var(--ac)]">
            命理核對 · Mingli Verify
          </Link>
          <nav className="flex flex-wrap gap-1.5 text-sm">
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    color: active ? "var(--ac)" : "var(--tx-2)",
                    background: active ? "var(--ac-bg)" : "transparent",
                    border: active ? "1px solid var(--ac-bdr)" : "1px solid transparent",
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="text-center text-[11px] text-[var(--tx-3)] px-4 pb-2 leading-relaxed">
          {PRIVACY_COPY.banner}
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-[var(--bdr)] text-center text-xs text-[var(--tx-3)] py-6 px-4">
        MIT · 規則／模板解讀・文化參考 · 唔構成專業諮詢保證 ·{" "}
        <Link href="/privacy" className="text-[var(--ac)] underline-offset-2 hover:underline">
          私隱政策
        </Link>
      </footer>
    </div>
  );
}
