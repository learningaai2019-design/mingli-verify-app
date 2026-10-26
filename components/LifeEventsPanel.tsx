"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MODULE_META,
  type ModuleId,
  type StoredModuleResult,
} from "@/lib/shared/compare-store";
import {
  FACT_MARK_LABEL,
  YEAR_MAX,
  YEAR_MIN,
  analyzeEventAgainstReadings,
  applyAutoJudgments,
  clearLifeEvents,
  createEmptyEvent,
  effectiveMark,
  loadLifeEvents,
  saveLifeEvents,
  tallyMarks,
  type EventJudgment,
  type FactMark,
  type LifeEvent,
} from "@/lib/shared/life-events-store";

const MARKS: FactMark[] = ["hit", "half", "miss"];

const MARK_STYLE: Record<FactMark, { bg: string; border: string; color: string }> = {
  hit: { bg: "rgba(56, 142, 60, 0.12)", border: "rgba(56, 142, 60, 0.4)", color: "#2e7d32" },
  half: { bg: "rgba(245, 158, 11, 0.14)", border: "rgba(180, 120, 20, 0.4)", color: "#9a6b00" },
  miss: { bg: "rgba(198, 40, 40, 0.1)", border: "rgba(198, 40, 40, 0.35)", color: "#c62828" },
};

function YearOptions() {
  const years: number[] = [];
  for (let y = YEAR_MAX; y >= YEAR_MIN; y -= 1) years.push(y);
  return years;
}

function MarkBadge({ mark, large }: { mark: FactMark; large?: boolean }) {
  const st = MARK_STYLE[mark];
  return (
    <span
      className={large ? "px-3 py-1 rounded-full text-sm font-semibold border" : "px-2 py-0.5 rounded-full text-xs font-medium border"}
      style={{ background: st.bg, color: st.color, borderColor: st.border }}
    >
      {FACT_MARK_LABEL[mark]}
    </span>
  );
}

export default function LifeEventsPanel({
  moduleResults,
}: {
  moduleResults: StoredModuleResult[];
}) {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [draftYear, setDraftYear] = useState(
    Math.min(YEAR_MAX, Math.max(YEAR_MIN, new Date().getFullYear())),
  );
  const [draftText, setDraftText] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [analyzedOnce, setAnalyzedOnce] = useState(false);
  const years = useMemo(() => YearOptions(), []);

  const persist = useCallback((next: LifeEvent[]) => {
    setEvents(next);
    saveLifeEvents(next);
  }, []);

  useEffect(() => {
    setEvents(loadLifeEvents());
  }, []);

  // Auto-run analysis whenever events or cached readings change (consultant-style primary UX)
  useEffect(() => {
    if (!events.length || !moduleResults.length) return;
    const filled = events.filter((e) => e.text.trim());
    if (!filled.length) return;
    const next = applyAutoJudgments(events, moduleResults);
    // Avoid loop: only write if auto marks / moduleMarks differ
    const changed = next.some((n, i) => {
      const o = events[i];
      if (!o) return true;
      if (n.mark !== o.mark) return true;
      const nk = Object.keys(n.moduleMarks || {});
      const ok = Object.keys(o.moduleMarks || {});
      if (nk.length !== ok.length) return true;
      return nk.some((k) => n.moduleMarks[k as ModuleId] !== o.moduleMarks[k as ModuleId]);
    });
    if (changed) {
      persist(next);
      setAnalyzedOnce(true);
    } else if (!analyzedOnce) {
      setAnalyzedOnce(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on moduleResults / event texts+years
  }, [moduleResults, events.map((e) => `${e.id}:${e.year}:${e.text}`).join("|")]);

  const filled = useMemo(() => events.filter((e) => e.text.trim()), [events]);
  const tally = useMemo(() => tallyMarks(events), [events]);

  const judgments = useMemo(() => {
    const map = new Map<string, EventJudgment>();
    for (const e of events) {
      if (!e.text.trim() || !moduleResults.length) continue;
      const j = analyzeEventAgainstReadings(e, moduleResults);
      if (j) map.set(e.id, j);
    }
    return map;
  }, [events, moduleResults]);

  function addEvent() {
    const text = draftText.trim();
    if (!text) return;
    const ev = createEmptyEvent(draftYear);
    ev.text = text.slice(0, 500);
    let next = [...events, ev].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
    if (moduleResults.length) next = applyAutoJudgments(next, moduleResults);
    persist(next);
    setAnalyzedOnce(true);
    setDraftText("");
  }

  function updateEvent(id: string, patch: Partial<LifeEvent>) {
    let next = events.map((e) => (e.id === id ? { ...e, ...patch } : e));
    // Re-auto when year/text change
    if ("year" in patch || "text" in patch) {
      if (moduleResults.length) next = applyAutoJudgments(next, moduleResults);
    }
    persist(next);
  }

  function removeEvent(id: string) {
    persist(events.filter((e) => e.id !== id));
  }

  function setOverride(id: string, mark: FactMark | null) {
    updateEvent(id, { userOverride: mark });
  }

  function rerunAll() {
    if (!moduleResults.length) return;
    const next = applyAutoJudgments(events, moduleResults);
    // Clear overrides so auto is primary again
    persist(next.map((e) => ({ ...e, userOverride: undefined })));
    setAnalyzedOnce(true);
  }

  function onClear() {
    clearLifeEvents();
    setEvents([]);
    setAnalyzedOnce(false);
  }

  return (
    <section className="card p-5 space-y-5" id="life-events">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="section-title mb-1">大事年表 · 自動核對</h2>
          <p className="text-sm text-[var(--tx-2)] max-w-2xl">
            輸入 2010–{YEAR_MAX} 嘅大事之後，App 會自動對照各系統已暫存嘅解讀（含流年段落），
            用顧問式啟發式判斷「中／一半／唔中」，並寫短原因——唔使你自己話準唔準。
            全部只留喺呢個瀏覽器分頁（sessionStorage），關分頁即清，唔會上傳伺服器。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={rerunAll}
            disabled={!filled.length || !moduleResults.length}
          >
            重新自動分析
          </button>
          <button type="button" className="btn-ghost" onClick={onClear} disabled={!events.length}>
            清除大事年表
          </button>
        </div>
      </div>

      {moduleResults.length === 0 && (
        <div className="rounded-xl border border-[var(--bdr)] bg-[rgba(245,158,11,0.08)] p-3 text-sm text-[var(--tx-2)]">
          暫時未有模組解讀暫存。請先去至少一個系統跑分析，返嚟呢度先可以自動對照。
        </div>
      )}

      {/* Add form */}
      <div className="rounded-xl border border-[var(--bdr)] bg-[rgba(255,252,247,0.6)] p-4 space-y-3">
        <p className="text-xs font-medium text-[var(--ac)]">加一條大事</p>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="space-y-1">
            <span className="label">年份</span>
            <select
              className="block min-w-[6.5rem] rounded-lg border border-[var(--bdr-med)] bg-white/80 px-3 py-2 text-sm"
              value={draftYear}
              onChange={(e) => setDraftYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-[12rem] space-y-1">
            <span className="label">事件（短述）</span>
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--bdr-med)] bg-white/80 px-3 py-2 text-sm"
              placeholder="例如：轉工、結婚、搬屋、健康轉折…"
              value={draftText}
              maxLength={500}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEvent();
                }
              }}
            />
          </label>
          <button type="button" className="btn-primary" onClick={addEvent} disabled={!draftText.trim()}>
            加入並自動核對
          </button>
        </div>
        <p className="text-[11px] text-[var(--tx-3)]">
          唔使填齊晒每一年——有大事先寫。唔好連同出生日期／全名一齊寫入呢度。
        </p>
      </div>

      {/* Summary of auto judgments */}
      {filled.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <span className="font-medium text-[var(--tx-0)]">自動核對總結</span>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: MARK_STYLE.hit.bg, color: MARK_STYLE.hit.color, border: `1px solid ${MARK_STYLE.hit.border}` }}
            >
              中 {tally.hit}
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: MARK_STYLE.half.bg, color: MARK_STYLE.half.color, border: `1px solid ${MARK_STYLE.half.border}` }}
            >
              一半 {tally.half}
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: MARK_STYLE.miss.bg, color: MARK_STYLE.miss.color, border: `1px solid ${MARK_STYLE.miss.border}` }}
            >
              唔中 {tally.miss}
            </span>
            {tally.unmarked > 0 && (
              <span className="text-xs text-[var(--tx-3)]">未分析 {tally.unmarked}</span>
            )}
            <span className="text-xs text-[var(--tx-3)]">共 {filled.length} 條</span>
          </div>
          <p className="text-[11px] text-[var(--tx-3)] leading-relaxed">
            免責：自動「中／一半／唔中」屬文化參考／啟發式關鍵字＋主題對照（優先流年段落），唔係保證準確，亦唔等於專業斷語。
          </p>
        </div>
      )}

      {/* Event list — auto judgment primary */}
      {events.length === 0 ? (
        <p className="text-sm text-[var(--tx-3)]">
          暫時未有大事。試下加一兩件近年真係發生過嘅事，App 會自動對照解讀判斷中／一半／唔中。
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const judgment = judgments.get(ev.id) || null;
            const shown = effectiveMark(ev);
            const overridden = ev.userOverride === "hit" || ev.userOverride === "half" || ev.userOverride === "miss";
            return (
              <article
                key={ev.id}
                className="rounded-xl border border-[var(--bdr)] p-4 space-y-3 bg-[rgba(255,255,255,0.45)]"
              >
                <div className="flex flex-wrap gap-2 items-start justify-between">
                  <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
                    <select
                      className="rounded-lg border border-[var(--bdr-med)] bg-white/80 px-2 py-1.5 text-sm font-medium"
                      value={ev.year}
                      onChange={(e) => updateEvent(ev.id, { year: Number(e.target.value) })}
                      aria-label="年份"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="flex-1 min-w-[10rem] rounded-lg border border-[var(--bdr-med)] bg-white/80 px-3 py-1.5 text-sm"
                      value={ev.text}
                      maxLength={500}
                      onChange={(e) => updateEvent(ev.id, { text: e.target.value })}
                      placeholder="事件描述"
                    />
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[var(--tx-3)] underline-offset-2 hover:underline"
                    onClick={() => removeEvent(ev.id)}
                  >
                    刪除
                  </button>
                </div>

                {/* Primary: auto judgment */}
                {ev.text.trim() && (
                  <div className="rounded-lg border border-[var(--bdr)] bg-[rgba(255,252,247,0.85)] p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-[var(--ac)]">App 自動判斷</span>
                      {shown ? (
                        <MarkBadge mark={shown} large />
                      ) : moduleResults.length === 0 ? (
                        <span className="text-xs text-[var(--tx-3)]">等有解讀暫存先分析</span>
                      ) : (
                        <span className="text-xs text-[var(--tx-3)]">分析中…</span>
                      )}
                      {overridden && (
                        <span className="text-[10px] text-[var(--tx-3)]">（已手動覆寫；自動原本：{ev.mark ? FACT_MARK_LABEL[ev.mark] : "—"}）</span>
                      )}
                    </div>
                    {judgment && (
                      <p className="text-sm text-[var(--tx-1)] leading-relaxed">{judgment.reason}</p>
                    )}

                    {/* Per-system columns */}
                    {judgment && judgment.perModule.length > 0 && (
                      <div className="overflow-x-auto pt-1">
                        <table className="w-full text-xs min-w-[280px]">
                          <thead>
                            <tr className="text-[var(--tx-3)] text-left">
                              <th className="py-1 pr-2 font-medium">系統</th>
                              <th className="py-1 pr-2 font-medium">判斷</th>
                              <th className="py-1 font-medium">原因（主題）</th>
                            </tr>
                          </thead>
                          <tbody>
                            {judgment.perModule.map((m) => (
                              <tr key={m.moduleId} className="border-t border-[var(--bdr)] align-top">
                                <td className="py-1.5 pr-2 whitespace-nowrap">
                                  <span className="badge">{MODULE_META[m.moduleId]?.label || m.moduleId}</span>
                                </td>
                                <td className="py-1.5 pr-2">
                                  <MarkBadge mark={m.mark} />
                                </td>
                                <td className="py-1.5 text-[var(--tx-2)] leading-snug">{m.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Secondary: optional manual override */}
                {showManual && ev.text.trim() && (
                  <div className="space-y-2 pt-1 border-t border-dashed border-[var(--bdr)]">
                    <p className="text-[11px] text-[var(--tx-3)]">手動覆寫（可選・次要）— 多數情況唔使改</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {MARKS.map((m) => {
                        const on = ev.userOverride === m;
                        const st = MARK_STYLE[m];
                        return (
                          <button
                            key={m}
                            type="button"
                            className="px-3 py-1 rounded-full text-sm border font-medium"
                            style={{
                              borderColor: on ? st.border : "var(--bdr)",
                              background: on ? st.bg : "transparent",
                              color: on ? st.color : "var(--tx-2)",
                            }}
                            onClick={() => setOverride(ev.id, on ? null : m)}
                          >
                            {FACT_MARK_LABEL[m]}
                          </button>
                        );
                      })}
                      {overridden && (
                        <button
                          type="button"
                          className="text-xs text-[var(--ac)] underline-offset-2 hover:underline"
                          onClick={() => setOverride(ev.id, null)}
                        >
                          清除覆寫（用返自動）
                        </button>
                      )}
                    </div>
                    <label className="block space-y-1">
                      <span className="label">短註（可選）</span>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-[var(--bdr)] bg-white/70 px-3 py-1.5 text-sm"
                        placeholder="例如：實際係轉工，解讀講轉折…"
                        value={ev.note}
                        maxLength={300}
                        onChange={(e) => updateEvent(ev.id, { note: e.target.value })}
                      />
                    </label>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <label className="flex items-center gap-1.5 text-xs text-[var(--tx-3)] cursor-pointer">
          <input
            type="checkbox"
            checked={showManual}
            onChange={(e) => setShowManual(e.target.checked)}
          />
          顯示手動覆寫（次要・可選）
        </label>
      </div>
    </section>
  );
}
