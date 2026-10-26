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
  clearLifeEvents,
  createEmptyEvent,
  loadLifeEvents,
  saveLifeEvents,
  suggestMarkForEvent,
  tallyMarks,
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
  const [showSuggest, setShowSuggest] = useState(true);
  const years = useMemo(() => YearOptions(), []);

  const persist = useCallback((next: LifeEvent[]) => {
    setEvents(next);
    saveLifeEvents(next);
  }, []);

  useEffect(() => {
    setEvents(loadLifeEvents());
  }, []);

  const filled = useMemo(() => events.filter((e) => e.text.trim()), [events]);
  const tally = useMemo(() => tallyMarks(events), [events]);

  function addEvent() {
    const text = draftText.trim();
    if (!text) return;
    const ev = createEmptyEvent(draftYear);
    ev.text = text.slice(0, 500);
    const next = [...events, ev].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
    persist(next);
    setDraftText("");
  }

  function updateEvent(id: string, patch: Partial<LifeEvent>) {
    persist(events.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeEvent(id: string) {
    persist(events.filter((e) => e.id !== id));
  }

  function setMark(id: string, mark: FactMark | null) {
    updateEvent(id, { mark });
  }

  function setModuleMark(id: string, moduleId: ModuleId, mark: FactMark | null) {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    updateEvent(id, {
      moduleMarks: { ...ev.moduleMarks, [moduleId]: mark },
    });
  }

  function applySuggest(id: string) {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    const s = suggestMarkForEvent(ev, moduleResults);
    if (!s.mark) return;
    updateEvent(id, {
      mark: s.mark,
      moduleMarks: { ...ev.moduleMarks, ...s.perModule },
    });
  }

  function onClear() {
    clearLifeEvents();
    setEvents([]);
  }

  return (
    <section className="card p-5 space-y-5" id="life-events">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="section-title mb-1">大事年表 · 事實核對</h2>
          <p className="text-sm text-[var(--tx-2)] max-w-2xl">
            簡單記入 2010–{YEAR_MAX} 嘅大事，再對照各系統解讀，自己標「中／一半／唔中」——好似顧問傾偈核對咁。
            全部只留喺呢個瀏覽器分頁（sessionStorage），關分頁即清，唔會上傳伺服器。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-1.5 text-xs text-[var(--tx-3)] cursor-pointer">
            <input
              type="checkbox"
              checked={showSuggest}
              onChange={(e) => setShowSuggest(e.target.checked)}
            />
            顯示參考建議
          </label>
          <button type="button" className="btn-ghost" onClick={onClear} disabled={!events.length}>
            清除大事年表
          </button>
        </div>
      </div>

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
            加入
          </button>
        </div>
        <p className="text-[11px] text-[var(--tx-3)]">
          唔使填齊晒每一年——有大事先寫。唔好連同出生日期／全名一齊寫入呢度。
        </p>
      </div>

      {/* Summary */}
      {filled.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <span className="font-medium text-[var(--tx-0)]">核對總結</span>
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
            <span className="text-xs text-[var(--tx-3)]">未標 {tally.unmarked}</span>
          )}
          <span className="text-xs text-[var(--tx-3)]">共 {filled.length} 條</span>
        </div>
      )}

      {/* Event list */}
      {events.length === 0 ? (
        <p className="text-sm text-[var(--tx-3)]">暫時未有大事。試下加一兩件近年真係發生過嘅事，再對照解讀標中／一半／唔中。</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const suggestion =
              showSuggest && moduleResults.length > 0
                ? suggestMarkForEvent(ev, moduleResults)
                : null;
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

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[var(--tx-2)]">事實核對（你嘅判斷）</span>
                    {MARKS.map((m) => {
                      const on = ev.mark === m;
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
                          onClick={() => setMark(ev.id, on ? null : m)}
                        >
                          {FACT_MARK_LABEL[m]}
                        </button>
                      );
                    })}
                  </div>

                  {suggestion && suggestion.mark && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--tx-3)]">
                      <span className="badge">參考建議</span>
                      <span>
                        {FACT_MARK_LABEL[suggestion.mark]}
                        {suggestion.reason ? ` — ${suggestion.reason}` : ""}
                      </span>
                      {ev.mark !== suggestion.mark && (
                        <button
                          type="button"
                          className="underline-offset-2 hover:underline text-[var(--ac)]"
                          onClick={() => applySuggest(ev.id)}
                        >
                          套用建議（仍可改）
                        </button>
                      )}
                    </div>
                  )}

                  {moduleResults.length > 0 && (
                    <div className="pt-1 space-y-1.5">
                      <p className="text-[11px] text-[var(--tx-3)]">各系統標記（可選）</p>
                      <div className="flex flex-col gap-1.5">
                        {moduleResults.map((r) => {
                          const mid = r.moduleId;
                          const cur = ev.moduleMarks[mid] ?? null;
                          return (
                            <div key={mid} className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="badge min-w-[3.5rem] justify-center">
                                {MODULE_META[mid]?.label || r.label}
                              </span>
                              {MARKS.map((m) => {
                                const on = cur === m;
                                const st = MARK_STYLE[m];
                                return (
                                  <button
                                    key={m}
                                    type="button"
                                    className="px-2 py-0.5 rounded-full border"
                                    style={{
                                      borderColor: on ? st.border : "var(--bdr)",
                                      background: on ? st.bg : "transparent",
                                      color: on ? st.color : "var(--tx-3)",
                                    }}
                                    onClick={() => setModuleMark(ev.id, mid, on ? null : m)}
                                  >
                                    {FACT_MARK_LABEL[m]}
                                  </button>
                                );
                              })}
                              {showSuggest && suggestion?.perModule[mid] && (
                                <span className="text-[10px] text-[var(--tx-3)]">
                                  建議 {FACT_MARK_LABEL[suggestion.perModule[mid] as FactMark]}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <label className="block space-y-1">
                    <span className="label">短註（可選）</span>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[var(--bdr)] bg-white/70 px-3 py-1.5 text-sm"
                      placeholder="例如：八字講轉折，實際係轉工…"
                      value={ev.note}
                      maxLength={300}
                      onChange={(e) => updateEvent(ev.id, { note: e.target.value })}
                    />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
