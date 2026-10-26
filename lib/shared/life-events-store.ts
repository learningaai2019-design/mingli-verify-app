/** Client-only life-events + fact-check marks — sessionStorage only, no server PII. */

import type { ModuleId, StoredModuleResult } from "./compare-store";
import { MODULE_META } from "./compare-store";

export type FactMark = "hit" | "half" | "miss";

export const FACT_MARK_LABEL: Record<FactMark, string> = {
  hit: "中",
  half: "一半",
  miss: "唔中",
};

export const YEAR_MIN = 2010;
export const YEAR_MAX = 2026;

export interface LifeEvent {
  id: string;
  year: number;
  text: string;
  /** User overall mark — source of truth. */
  mark: FactMark | null;
  note: string;
  /** Optional per-system marks. */
  moduleMarks: Partial<Record<ModuleId, FactMark | null>>;
}

const STORAGE_KEY = "mingli-verify-life-events-v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function newId() {
  return `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadLifeEvents(): LifeEvent[] {
  if (!canUseStorage()) return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LifeEvent[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.year === "number" && typeof e.text === "string")
      .map((e) => ({
        id: String(e.id || newId()),
        year: Math.min(YEAR_MAX, Math.max(YEAR_MIN, Math.round(e.year))),
        text: String(e.text || "").slice(0, 500),
        mark: e.mark === "hit" || e.mark === "half" || e.mark === "miss" ? e.mark : null,
        note: String(e.note || "").slice(0, 300),
        moduleMarks: e.moduleMarks && typeof e.moduleMarks === "object" ? e.moduleMarks : {},
      }))
      .sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  } catch {
    return [];
  }
}

function writeAll(list: LifeEvent[]) {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}

export function saveLifeEvents(list: LifeEvent[]) {
  writeAll(
    list.map((e) => ({
      id: e.id,
      year: e.year,
      text: String(e.text || "").slice(0, 500),
      mark: e.mark,
      note: String(e.note || "").slice(0, 300),
      moduleMarks: e.moduleMarks || {},
    })),
  );
}

export function clearLifeEvents() {
  if (!canUseStorage()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function createEmptyEvent(year = Math.min(YEAR_MAX, Math.max(YEAR_MIN, new Date().getFullYear()))): LifeEvent {
  return {
    id: newId(),
    year,
    text: "",
    mark: null,
    note: "",
    moduleMarks: {},
  };
}

export function tallyMarks(events: LifeEvent[]): { hit: number; half: number; miss: number; unmarked: number } {
  let hit = 0;
  let half = 0;
  let miss = 0;
  let unmarked = 0;
  for (const e of events) {
    if (!e.text.trim()) continue;
    if (e.mark === "hit") hit += 1;
    else if (e.mark === "half") half += 1;
    else if (e.mark === "miss") miss += 1;
    else unmarked += 1;
  }
  return { hit, half, miss, unmarked };
}

/** Very light keyword overlap vs module readings — labelled 參考建議 only. */
export function suggestMarkForEvent(
  event: LifeEvent,
  results: StoredModuleResult[],
): { mark: FactMark | null; reason: string; perModule: Partial<Record<ModuleId, FactMark | null>> } {
  const text = event.text.trim();
  if (!text || results.length === 0) {
    return { mark: null, reason: "", perModule: {} };
  }

  const yearStr = String(event.year);
  const tokens = tokenize(text);
  const perModule: Partial<Record<ModuleId, FactMark | null>> = {};
  const scores: { id: ModuleId; score: number; yearHit: boolean }[] = [];

  for (const r of results) {
    const blob = r.sections.map((s) => `${s.title}\n${s.text}`).join("\n");
    const yearHit = blob.includes(yearStr) || blob.includes(`${event.year}年`);
    let hits = 0;
    for (const t of tokens) {
      if (blob.includes(t)) hits += 1;
    }
    const ratio = tokens.length ? hits / tokens.length : 0;
    let mark: FactMark | null = null;
    if (yearHit && ratio >= 0.35) mark = "hit";
    else if (yearHit || ratio >= 0.45) mark = "half";
    else if (tokens.length >= 2 && ratio < 0.15) mark = "miss";
    else if (ratio >= 0.25) mark = "half";
    perModule[r.moduleId] = mark;
    scores.push({ id: r.moduleId, score: ratio + (yearHit ? 0.25 : 0), yearHit });
  }

  const avg = scores.reduce((s, x) => s + x.score, 0) / Math.max(1, scores.length);
  const yearAny = scores.some((s) => s.yearHit);
  let mark: FactMark | null = null;
  if (avg >= 0.45 || (yearAny && avg >= 0.3)) mark = "hit";
  else if (avg >= 0.2 || yearAny) mark = "half";
  else if (tokens.length >= 2) mark = "miss";

  const labels = scores
    .filter((s) => perModule[s.id])
    .map((s) => `${MODULE_META[s.id]?.label || s.id}:${FACT_MARK_LABEL[perModule[s.id] as FactMark]}`)
    .slice(0, 4)
    .join(" · ");

  const reason = mark
    ? `按解讀摘要關鍵字粗略對照（${labels || "無明顯對應"}）。僅供參考，請你自己揀。`
    : "暫未從現有解讀摘要搵到明顯對應，請自行判斷。";

  return { mark, reason, perModule };
}

function tokenize(text: string): string[] {
  const cleaned = text
    .replace(/[，。、「」『』（）()！？!?,.\s]+/g, " ")
    .trim();
  const parts = cleaned.split(" ").filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (p.length >= 2) out.push(p);
    // also split CJK bigrams from longer runs without spaces
    if (/[\u4e00-\u9fff]/.test(p) && p.length >= 4) {
      for (let i = 0; i < p.length - 1; i += 1) {
        const bi = p.slice(i, i + 2);
        if (bi.length === 2) out.push(bi);
      }
    }
  }
  return Array.from(new Set(out)).filter((t) => t.length >= 2).slice(0, 24);
}
