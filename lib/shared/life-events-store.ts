/** Client-only life-events + auto fact-check vs cached readings — sessionStorage only, no server PII. */

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
  /**
   * Display / tally mark. Prefer auto judgment; optional userOverride wins when set.
   * Kept for backward-compat with older sessionStorage payloads.
   */
  mark: FactMark | null;
  note: string;
  /** Per-system marks (auto-filled; optional manual override per module). */
  moduleMarks: Partial<Record<ModuleId, FactMark | null>>;
  /** Optional user override of overall mark — secondary UX. */
  userOverride?: FactMark | null;
}

export interface ModuleJudgment {
  moduleId: ModuleId;
  mark: FactMark;
  reason: string;
  /** Short theme label cited in the reason, e.g. 流年・事業 */
  theme: string;
}

export interface EventJudgment {
  mark: FactMark;
  reason: string;
  perModule: ModuleJudgment[];
}

const STORAGE_KEY = "mingli-verify-life-events-v1";

/** Event-theme buckets → reading title / key aliases (HK Cantonese life topics). */
const THEME_GROUPS: { id: string; label: string; eventHints: string[]; sectionHints: string[] }[] = [
  {
    id: "career",
    label: "事業",
    eventHints: ["轉工", "辭職", "失業", "入職", "升職", "調職", "開工", "創業", "生意", "工作", "事業", "面試", "裁員", "跳槽", "職位", "上司", "公司", "開業", "倒閉", "freelance"],
    sectionHints: ["事業", "官祿", "流年事業", "流年・事業", "事業取向", "行動", "事業擴張"],
  },
  {
    id: "wealth",
    label: "財運",
    eventHints: ["財", "錢", "投資", "虧", "賺", "收入", "加薪", "減薪", "買樓按揭", "債務", "借貸", "破產", "中獎", "生意額", "財富"],
    sectionHints: ["財運", "財帛", "流年財運", "流年・財運", "財帛資源"],
  },
  {
    id: "love",
    label: "感情",
    eventHints: ["結婚", "離婚", "分手", "拍拖", "戀愛", "訂婚", "復合", "出軌", "結婚", "婚禮", "伴侶", "配偶", "感情", "男友", "女友", "老公", "老婆"],
    sectionHints: ["感情", "夫妻", "流年夫妻", "流年・婚姻", "伴侶", "關係"],
  },
  {
    id: "health",
    label: "健康",
    eventHints: ["病", "手術", "住院", "健康", "受傷", "意外", "產後", "懷孕", "產子", "生仔", "生女", "癌症", "抑鬱", "焦慮", "身體", "覆診", "康復"],
    sectionHints: ["健康", "疾厄", "流年健康", "流年・健康", "健康節奏"],
  },
  {
    id: "home",
    label: "田宅／搬遷",
    eventHints: ["搬屋", "搬家", "裝修", "買樓", "賣樓", "租屋", "移民", "出國", "旅居", "安家", "置業", "收樓", "田宅", "遷移"],
    sectionHints: ["田宅", "遷移", "流年田宅", "流年・田宅", "外出／遷移", "家居"],
  },
  {
    id: "family",
    label: "家人／人際",
    eventHints: ["父母", "爸爸", "媽媽", "阿爸", "阿媽", "兄弟", "姊妹", "仔女", "子女", "親友", "朋友", "人際", "爭執", "和解", "離世", "喪", "生育"],
    sectionHints: ["父母", "兄弟", "子女", "朋輩", "流年父母", "流年兄弟", "流年子女", "流年朋輩", "交友"],
  },
  {
    id: "study",
    label: "學業",
    eventHints: ["讀書", "考試", "畢業", "入學", "退學", "進修", "學業", "學位", "論文", "DSE", "公開試", "留學"],
    sectionHints: ["學業", "流年學業", "流年・學業", "思考"],
  },
  {
    id: "life",
    label: "人生節奏",
    eventHints: ["轉折", "轉運", "低潮", "高峰", "壓力", "休息", "轉型", "改變", "危機", "轉機", "大事"],
    sectionHints: ["流年總論", "口語綜合", "早年到晚年", "福德", "人生", "輪廓", "情緒"],
  },
];

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
        userOverride:
          e.userOverride === "hit" || e.userOverride === "half" || e.userOverride === "miss"
            ? e.userOverride
            : e.userOverride === null
              ? null
              : undefined,
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
      userOverride: e.userOverride,
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

/** Effective mark for tally: userOverride if set, else auto mark. */
export function effectiveMark(e: LifeEvent): FactMark | null {
  if (e.userOverride === "hit" || e.userOverride === "half" || e.userOverride === "miss") {
    return e.userOverride;
  }
  return e.mark;
}

export function tallyMarks(events: LifeEvent[]): { hit: number; half: number; miss: number; unmarked: number } {
  let hit = 0;
  let half = 0;
  let miss = 0;
  let unmarked = 0;
  for (const e of events) {
    if (!e.text.trim()) continue;
    const m = effectiveMark(e);
    if (m === "hit") hit += 1;
    else if (m === "half") half += 1;
    else if (m === "miss") miss += 1;
    else unmarked += 1;
  }
  return { hit, half, miss, unmarked };
}

function detectThemes(eventText: string): typeof THEME_GROUPS {
  const hits = THEME_GROUPS.filter((g) => g.eventHints.some((h) => eventText.includes(h)));
  return hits.length ? hits : THEME_GROUPS.filter((g) => g.id === "life");
}

function tokenize(text: string): string[] {
  const cleaned = text
    .replace(/[，。、「」『』（）()！？!?,.\s]+/g, " ")
    .trim();
  const parts = cleaned.split(" ").filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (p.length >= 2) out.push(p);
    if (/[\u4e00-\u9fff]/.test(p) && p.length >= 4) {
      for (let i = 0; i < p.length - 1; i += 1) {
        const bi = p.slice(i, i + 2);
        if (bi.length === 2) out.push(bi);
      }
    }
  }
  return Array.from(new Set(out)).filter((t) => t.length >= 2).slice(0, 24);
}

function sectionMatchesTheme(
  title: string,
  key: string,
  hints: string[],
): boolean {
  return hints.some((h) => title.includes(h) || key.includes(h));
}

function detectCachedLiunianYear(result: StoredModuleResult): number | null {
  // e.g. title "流年 2018（戊戌）總論" or text mentioning a single prominent year near 流年
  for (const s of result.sections) {
    if (!(s.key.startsWith("流年") || s.title.includes("流年"))) continue;
    const m = (s.title + " " + s.text.slice(0, 80)).match(/(20[1-2]\d)\s*年?/);
    if (m) return Number(m[1]);
  }
  return null;
}

function scoreModule(
  event: LifeEvent,
  result: StoredModuleResult,
  themes: typeof THEME_GROUPS,
  tokens: string[],
): ModuleJudgment {
  const yearStr = String(event.year);
  const yearHint = `${event.year}年`;
  const cachedYear = detectCachedLiunianYear(result);
  const yearMatchesCache = cachedYear === event.year;

  // Prefer year-luck / year-titled sections when present AND year aligns
  const yearSections = result.sections.filter(
    (s) =>
      s.title.includes(yearStr) ||
      s.text.includes(yearStr) ||
      s.title.includes(yearHint) ||
      (yearMatchesCache && (s.key.startsWith("流年") || s.title.includes("流年"))),
  );

  const themeMatchedSections: { title: string; text: string; themeLabel: string; yearScoped: boolean }[] = [];

  for (const theme of themes) {
    for (const s of result.sections) {
      if (!sectionMatchesTheme(s.title, s.key, theme.sectionHints)) continue;
      const isLiunian = s.key.startsWith("流年") || s.title.includes("流年");
      const yearScoped =
        s.title.includes(yearStr) ||
        s.text.includes(yearStr) ||
        (isLiunian && yearMatchesCache);
      themeMatchedSections.push({
        title: s.title || s.key,
        text: s.text,
        themeLabel: theme.label,
        yearScoped,
      });
    }
  }

  // Fallback: whole blob keyword overlap
  const blob = result.sections.map((s) => `${s.title}\n${s.text}`).join("\n");
  const yearInBlob = blob.includes(yearStr) || blob.includes(yearHint);
  let tokenHits = 0;
  for (const t of tokens) {
    if (blob.includes(t)) tokenHits += 1;
  }
  const tokenRatio = tokens.length ? tokenHits / tokens.length : 0;

  // Theme + year quality
  const yearThemeHits = themeMatchedSections.filter((s) => s.yearScoped);
  const anyTheme = themeMatchedSections.length > 0;
  const bestTheme =
    yearThemeHits[0]?.themeLabel ||
    themeMatchedSections[0]?.themeLabel ||
    (yearSections[0] ? "流年" : "綜合");

  // Keyword overlap inside the best theme sections
  const themeBlob = (yearThemeHits.length ? yearThemeHits : themeMatchedSections)
    .map((s) => s.text)
    .join("\n");
  let themeTokenHits = 0;
  if (themeBlob) {
    for (const t of tokens) {
      if (themeBlob.includes(t)) themeTokenHits += 1;
    }
  }
  const themeRatio = tokens.length && themeBlob ? themeTokenHits / tokens.length : 0;

  // Sentiment-ish: reading mentions change / turn / move vs calm — soft boost when event implies change
  const changeWords = ["轉", "變", "動", "起伏", "考驗", "機遇", "壓力", "低潮", "轉折", "搬", "離"];
  const eventChange = changeWords.some((w) => event.text.includes(w));
  const readingChange = changeWords.some((w) => (themeBlob || blob).includes(w));

  let mark: FactMark;
  let reason: string;

  if (yearThemeHits.length && (themeRatio >= 0.2 || eventChange === readingChange)) {
    mark = themeRatio >= 0.15 || readingChange === eventChange ? "hit" : "half";
    reason = `對上${MODULE_META[result.moduleId]?.label || result.label}「${yearThemeHits[0].title}」主題（${bestTheme}），同${event.year}年流年／範疇方向${mark === "hit" ? "合拍" : "部分合拍"}。`;
  } else if (anyTheme && yearInBlob) {
    mark = themeRatio >= 0.25 || tokenRatio >= 0.3 ? "hit" : "half";
    reason = `解讀有「${bestTheme}」相關段落，亦提到${event.year}年附近節奏；關鍵字重疊${mark === "hit" ? "夠高" : "一般"}，判${FACT_MARK_LABEL[mark]}。`;
  } else if (anyTheme && (themeRatio >= 0.35 || tokenRatio >= 0.4)) {
    mark = "half";
    reason = `有「${bestTheme}」主題呼應，但未見明確${event.year}年流年對位，先判一半。`;
  } else if (yearInBlob && tokenRatio >= 0.25) {
    mark = "half";
    reason = `流年／年份有提及，主題對位偏弱，關鍵字略有重疊 → 一半。`;
  } else if (tokenRatio >= 0.45) {
    mark = "half";
    reason = `整體解讀關鍵字有一定重疊，但缺清晰主題／流年對位 → 一半。`;
  } else if (tokens.length >= 2 && tokenRatio < 0.12 && !anyTheme) {
    mark = "miss";
    reason = `現有${MODULE_META[result.moduleId]?.label || result.label}摘要未見「${themes.map((t) => t.label).join("／")}」或${event.year}年對應，判唔中。`;
  } else if (!anyTheme && !yearInBlob && tokenRatio < 0.2) {
    mark = "miss";
    reason = `對照${MODULE_META[result.moduleId]?.label || result.label}暫搵唔到同呢件大事相符嘅主題，判唔中。`;
  } else {
    mark = "half";
    reason = `訊號混雜（主題／年份／關鍵字唔齊），保守判一半。`;
  }

  return {
    moduleId: result.moduleId,
    mark,
    reason,
    theme: bestTheme,
  };
}

/**
 * Auto-judge one life event against cached module readings (consultant-style heuristic).
 * Cultural reference only — not a guarantee of accuracy.
 */
export function analyzeEventAgainstReadings(
  event: LifeEvent,
  results: StoredModuleResult[],
): EventJudgment | null {
  const text = event.text.trim();
  if (!text || results.length === 0) return null;

  const themes = detectThemes(text);
  const tokens = tokenize(text);
  const perModule = results.map((r) => scoreModule(event, r, themes, tokens));

  const rank = (m: FactMark) => (m === "hit" ? 2 : m === "half" ? 1 : 0);
  const avg = perModule.reduce((s, j) => s + rank(j.mark), 0) / perModule.length;
  let mark: FactMark;
  if (avg >= 1.5) mark = "hit";
  else if (avg >= 0.75) mark = "half";
  else mark = "miss";

  const themeNames = Array.from(new Set(perModule.map((j) => j.theme))).slice(0, 3).join("、");
  const hitMods = perModule.filter((j) => j.mark === "hit").map((j) => MODULE_META[j.moduleId]?.label || j.moduleId);
  const missMods = perModule.filter((j) => j.mark === "miss").map((j) => MODULE_META[j.moduleId]?.label || j.moduleId);

  let reason: string;
  if (mark === "hit") {
    reason = `多數系統喺「${themeNames}」同${event.year}年節奏對得上${hitMods.length ? `（${hitMods.join("、")}偏中）` : ""}。`;
  } else if (mark === "miss") {
    reason = `各系統摘要同呢件大事主題對唔上${missMods.length ? `（${missMods.join("、")}偏唔中）` : ""}。`;
  } else {
    reason = `有啲系統喺「${themeNames}」有呼應、有啲未對上，綜合判一半。`;
  }

  return { mark, reason, perModule };
}

/** @deprecated alias — prefer analyzeEventAgainstReadings */
export function suggestMarkForEvent(
  event: LifeEvent,
  results: StoredModuleResult[],
): { mark: FactMark | null; reason: string; perModule: Partial<Record<ModuleId, FactMark | null>> } {
  const j = analyzeEventAgainstReadings(event, results);
  if (!j) return { mark: null, reason: "", perModule: {} };
  const per: Partial<Record<ModuleId, FactMark | null>> = {};
  for (const m of j.perModule) per[m.moduleId] = m.mark;
  return { mark: j.mark, reason: j.reason, perModule: per };
}

/** Apply auto judgments onto a list of events; preserves userOverride. */
export function applyAutoJudgments(
  events: LifeEvent[],
  results: StoredModuleResult[],
): LifeEvent[] {
  return events.map((e) => {
    if (!e.text.trim()) return e;
    const j = analyzeEventAgainstReadings(e, results);
    if (!j) return { ...e, mark: null, moduleMarks: {} };
    const moduleMarks: Partial<Record<ModuleId, FactMark | null>> = {};
    for (const m of j.perModule) moduleMarks[m.moduleId] = m.mark;
    return {
      ...e,
      mark: j.mark,
      moduleMarks,
      // keep userOverride untouched
    };
  });
}
