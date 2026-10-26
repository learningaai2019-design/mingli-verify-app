"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PRIVACY_COPY } from "@/lib/shared/privacy";

const PRIMARY_NAV = [
  { href: "/", label: "首頁" },
  { href: "/bazi", label: "八字" },
  { href: "/ziwei", label: "紫微" },
  { href: "/liuyao", label: "六爻" },
  { href: "/compare", label: "比對" },
];

const OTHER_NAV = [
  { href: "/name", label: "姓名" },
  { href: "/western", label: "西洋" },
  { href: "/humandesign", label: "人類圖" },
];

function navStyle(active: boolean, emphasize = false): React.CSSProperties {
  return {
    color: active ? "var(--ac)" : "var(--tx-2)",
    background: active ? "var(--ac-bg)" : "transparent",
    border: active ? "1px solid var(--ac-bdr)" : "1px solid transparent",
    fontWeight: emphasize ? 600 : undefined,
  };
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [otherOpen, setOtherOpen] = useState(false);
  const otherRef = useRef<HTMLDivElement>(null);
  const otherActive = OTHER_NAV.some((n) => path === n.href);

  useEffect(() => {
    setOtherOpen(false);
  }, [path]);

  useEffect(() => {
    if (!otherOpen) return;
    function onDoc(e: MouseEvent) {
      if (otherRef.current && !otherRef.current.contains(e.target as Node)) {
        setOtherOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOtherOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [otherOpen]);

  return (
    <div className="app-bg min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--bdr)] backdrop-blur-md bg-[var(--header-bg)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <Link href="/" className="font-semibold tracking-wide text-[var(--ac)]">
            命理核對 · Mingli Verify
          </Link>
          <nav className="flex flex-wrap items-center gap-1.5 text-sm">
            {PRIMARY_NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-2.5 py-1 rounded-full"
                  style={navStyle(active, n.href === "/compare")}
                >
                  {n.label}
                </Link>
              );
            })}
            <div className="relative" ref={otherRef}>
              <button
                type="button"
                className="px-2.5 py-1 rounded-full"
                style={navStyle(otherActive || otherOpen)}
                aria-expanded={otherOpen}
                aria-haspopup="menu"
                onClick={() => setOtherOpen((o) => !o)}
              >
                其他{otherOpen ? " ▴" : " ▾"}
              </button>
              {otherOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-1 min-w-[7.5rem] rounded-xl border border-[var(--bdr)] bg-[var(--header-bg)] shadow-lg py-1 z-50"
                >
                  {OTHER_NAV.map((n) => {
                    const active = path === n.href;
                    return (
                      <Link
                        key={n.href}
                        href={n.href}
                        role="menuitem"
                        className="block px-3 py-2 text-sm"
                        style={{
                          color: active ? "var(--ac)" : "var(--tx-1)",
                          background: active ? "var(--ac-bg)" : "transparent",
                          fontWeight: active ? 600 : undefined,
                        }}
                        onClick={() => setOtherOpen(false)}
                      >
                        {n.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>
        <div className="text-center text-[11px] text-[var(--tx-3)] px-4 pb-2 leading-relaxed">
          {PRIVACY_COPY.banner}
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-[var(--bdr)] text-center text-xs text-[var(--tx-3)] py-6 px-4 bg-[rgba(255,248,240,0.6)]">
        MIT · 規則／模板解讀・文化參考 · 唔構成專業諮詢保證 ·{" "}
        <Link href="/privacy" className="text-[var(--ac)] underline-offset-2 hover:underline">
          私隱政策
        </Link>
        {" · "}
        <Link href="/compare" className="text-[var(--ac)] underline-offset-2 hover:underline">
          系統比對
        </Link>
      </footer>
    </div>
  );
}
