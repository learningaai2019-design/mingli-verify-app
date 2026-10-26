"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  COMPARE_DOMAINS,
  MODULE_META,
  clearAllResults,
  clearModuleResult,
  findSectionText,
  loadAllResults,
  type ModuleId,
  type StoredModuleResult,
} from "@/lib/shared/compare-store";
import LifeEventsPanel from "@/components/LifeEventsPanel";
import FollowUpAsk from "@/components/FollowUpAsk";
import {
  loadBaziChartSession,
  loadZiweiChartSession,
  clearAllChartSessions,
} from "@/lib/shared/session-chart";
import type { BaziChart } from "@/lib/bazi/engine";
import type { ZiweiChartView } from "@/lib/ziwei/engine";

type ViewMode = "matrix" | "cards";

export default function ComparePage() {
  const [results, setResults] = useState<StoredModuleResult[]>([]);
  const [selected, setSelected] = useState<ModuleId[]>([]);
  const [mode, setMode] = useState<ViewMode>("matrix");
  const [tick, setTick] = useState(0);
  const [baziChart, setBaziChart] = useState<BaziChart | null>(null);
  const [ziweiChart, setZiweiChart] = useState<ZiweiChartView | null>(null);
  const [followModule, setFollowModule] = useState<"bazi" | "ziwei">("bazi");

  const refresh = useCallback(() => {
    const list = loadAllResults().sort((a, b) => a.savedAt - b.savedAt);
    setResults(list);
    setSelected((prev) => {
      const ids = list.map((r) => r.moduleId);
      if (prev.length === 0) return ids;
      const kept = prev.filter((id) => ids.includes(id));
      return kept.length ? kept : ids;
    });
    setBaziChart(loadBaziChartSession());
    setZiweiChart(loadZiweiChartSession());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, tick]);

  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const active = useMemo(
    () => results.filter((r) => selected.includes(r.moduleId)),
    [results, selected],
  );

  function toggle(id: ModuleId) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function fmtTime(ts: number) {
    try {
      return new Date(ts).toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" });
    } catch {
      return "—";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ac)]">系統比對</h1>
          <p className="text-sm text-[var(--tx-2)] mt-1 max-w-xl">
            試完唔同系統之後，喺呢度並排睇性格／事業／財運／感情／健康等領域，方便核對邊啲講法相近、邊啲有出入。
            只讀 sessionStorage 入面嘅解讀摘要（唔含出生日期／姓名）。
          </p>
          <p className="text-xs text-[var(--tx-3)] mt-2">
            <a href="#life-events" className="text-[var(--ac)] underline-offset-2 hover:underline">
              ↓ 跳去大事年表 · 自動核對（App 判斷中／一半／唔中）
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => setTick((t) => t + 1)}>
            重新整理
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              clearAllResults();
              clearAllChartSessions();
              setResults([]);
              setSelected([]);
              setBaziChart(null);
              setZiweiChart(null);
            }}
          >
            清除全部比對暫存
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card p-6 space-y-3 text-sm text-[var(--tx-2)]">
          <p className="text-[var(--tx-0)] font-medium">暫時未有可比對結果</p>
          <p>請先去至少兩個模組跑一次分析；完成後會自動留下解讀摘要喺呢個分頁（關瀏覽器分頁即清）。</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {(Object.keys(MODULE_META) as ModuleId[]).map((id) => (
              <Link key={id} href={MODULE_META[id].href} className="btn-ghost">
                去 {MODULE_META[id].label}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          <section className="card p-5 space-y-4">
            <h2 className="section-title">可選系統（已有結果）</h2>
            <div className="flex flex-wrap gap-2">
              {results.map((r) => {
                const on = selected.includes(r.moduleId);
                return (
                  <button
                    key={r.moduleId}
                    type="button"
                    className="px-3 py-1.5 rounded-full text-sm border"
                    style={{
                      borderColor: on ? "var(--ac-bdr)" : "var(--bdr)",
                      background: on ? "var(--ac-bg)" : "transparent",
                      color: on ? "var(--ac)" : "var(--tx-2)",
                    }}
                    onClick={() => toggle(r.moduleId)}
                  >
                    {MODULE_META[r.moduleId]?.label || r.label}
                    <span className="ml-1 text-[10px] opacity-70">{fmtTime(r.savedAt)}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="label mb-0 mr-1">顯示方式</span>
              {([
                ["matrix", "矩陣表"],
                ["cards", "卡片並排"],
              ] as const).map(([k, lab]) => (
                <button
                  key={k}
                  type="button"
                  className="px-3 py-1.5 rounded-full text-sm border"
                  style={{
                    borderColor: mode === k ? "var(--ac-bdr)" : "var(--bdr)",
                    background: mode === k ? "var(--ac-bg)" : "transparent",
                    color: mode === k ? "var(--ac)" : "var(--tx-2)",
                  }}
                  onClick={() => setMode(k)}
                >
                  {lab}
                </button>
              ))}
            </div>
            {results.map((r) => (
              <div key={r.moduleId} className="flex flex-wrap items-center gap-2 text-xs text-[var(--tx-3)]">
                <span className="badge">{MODULE_META[r.moduleId]?.label}</span>
                <span>{r.sections.length} 段解讀</span>
                <Link href={MODULE_META[r.moduleId].href} className="text-[var(--ac)] underline-offset-2 hover:underline">
                  返模組
                </Link>
                <button
                  type="button"
                  className="underline-offset-2 hover:underline"
                  onClick={() => {
                    clearModuleResult(r.moduleId);
                    setTick((t) => t + 1);
                  }}
                >
                  移除呢個
                </button>
              </div>
            ))}
          </section>

          {active.length < 2 ? (
            <div className="card p-5 text-sm text-[var(--tx-2)]">
              請至少勾選兩個系統先好睇並排比對啦～而家有 {active.length} 個。
            </div>
          ) : mode === "matrix" ? (
            <section className="card p-3 sm:p-4 overflow-x-auto">
              <table className="compare-table min-w-[640px]">
                <thead>
                  <tr>
                    <th className="sticky-col">領域</th>
                    {active.map((r) => (
                      <th key={r.moduleId}>{MODULE_META[r.moduleId]?.label || r.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_DOMAINS.map((d) => {
                    const cells = active.map((r) => findSectionText(r, d.id));
                    if (cells.every((c) => !c)) return null;
                    return (
                      <tr key={d.id}>
                        <td className="sticky-col">{d.title}</td>
                        {cells.map((text, i) => (
                          <td key={active[i].moduleId} className={text ? "" : "empty"}>
                            {text || "（呢個系統未有對應段落）"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-[11px] text-[var(--tx-3)] mt-3 px-1">
                各系統領域名稱唔完全一樣，表內會按相近關鍵字對齊。全部內容屬規則／模板解讀・文化參考。
              </p>
            </section>
          ) : (
            <section className="space-y-5">
              {COMPARE_DOMAINS.map((d) => {
                const cols = active
                  .map((r) => ({ r, text: findSectionText(r, d.id) }))
                  .filter((x) => x.text);
                if (!cols.length) return null;
                return (
                  <div key={d.id} className="space-y-2">
                    <h3 className="section-title mb-0">{d.title}</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {cols.map(({ r, text }) => (
                        <div key={r.moduleId} className="card p-4">
                          <div className="badge mb-2">{MODULE_META[r.moduleId]?.label}</div>
                          <p className="text-sm text-[var(--tx-1)] whitespace-pre-wrap">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}

      <section className="card p-5 space-y-3 border-[var(--ac-bdr)]">
        <h2 className="section-title mb-0">跟進詢問（重用已排盤面）</h2>
        <p className="text-sm text-[var(--tx-2)]">
          同一個整合入口：若你已喺八字／紫微頁跑過分析，可喺呢度繼續問某步大運、某年或人生域——唔另開雜項功能。
        </p>
        <div className="flex flex-wrap gap-2">
          {(["bazi", "ziwei"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className="px-3 py-1.5 rounded-full text-sm border"
              style={{
                borderColor: followModule === m ? "var(--ac-bdr)" : "var(--bdr)",
                background: followModule === m ? "var(--ac-bg)" : "transparent",
                color: followModule === m ? "var(--ac)" : "var(--tx-2)",
              }}
              onClick={() => setFollowModule(m)}
            >
              {m === "bazi" ? "八字盤" : "紫微盤"}
              {m === "bazi" ? (baziChart ? " ✓" : "（未有）") : ziweiChart ? " ✓" : "（未有）"}
            </button>
          ))}
        </div>
        <FollowUpAsk
          module={followModule}
          chart={followModule === "bazi" ? baziChart : ziweiChart}
          disabledReason={
            followModule === "bazi"
              ? "請先去八字頁跑一次一生解讀。"
              : "請先去紫微頁跑一次宮星四化解讀。"
          }
        />
      </section>

      <LifeEventsPanel moduleResults={active.length ? active : results} />

      <p className="text-xs text-[var(--tx-3)] leading-relaxed">
        免責：系統比對同大事自動核對只幫測試者觀察模板輸出同啟發式主題對照，屬文化參考，唔等於「邊個準」、專業斷語或保證。自動「中／一半／唔中」唔係占卜結果。
      </p>
    </div>
  );
}
