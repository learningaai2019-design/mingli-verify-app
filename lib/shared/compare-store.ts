/** Client-only compare cache — reading summaries only, no birth/name PII. */

import type { DomainSection, TemplateReading } from "./types";

export type ModuleId = "bazi" | "ziwei" | "western" | "humandesign" | "liuyao" | "name";

export const MODULE_META: Record<ModuleId, { label: string; href: string }> = {
  bazi: { label: "八字", href: "/bazi" },
  ziwei: { label: "紫微", href: "/ziwei" },
  western: { label: "西洋", href: "/western" },
  humandesign: { label: "人類圖", href: "/humandesign" },
  liuyao: { label: "六爻", href: "/liuyao" },
  name: { label: "姓名", href: "/name" },
};

export interface StoredModuleResult {
  moduleId: ModuleId;
  label: string;
  disclaimer: string;
  sections: DomainSection[];
  savedAt: number;
}

const STORAGE_KEY = "mingli-verify-compare-v1";

/** Domains used in the side-by-side matrix (HK Cantonese labels). */
export const COMPARE_DOMAINS: { id: string; title: string; aliases: string[] }[] = [
  { id: "personality", title: "性格", aliases: ["性格", "性格／命主", "命宮", "類型", "類型／策略", "人格", "盤面總論", "總論", "流年性格", "流年・性格／狀態", "口語綜合", "十年大運", "大運性格", "大運・"] },
  { id: "career", title: "事業", aliases: ["事業", "官祿", "事業擴張", "事業取向", "事業取向（模板）", "行動", "流年事業", "流年・事業", "大運事業"] },
  { id: "wealth", title: "財運", aliases: ["財帛", "財帛資源", "財運", "流年財運", "流年・財運", "大運財運"] },
  { id: "love", title: "感情", aliases: ["夫妻", "感情", "感情價值", "關係", "關係（模板）", "伴侶關係", "流年夫妻", "流年・婚姻／配偶", "大運感情"] },
  { id: "health", title: "健康", aliases: ["健康", "疾厄", "健康節奏", "流年健康", "流年・健康", "大運健康"] },
  { id: "study", title: "學業", aliases: ["學業", "思考", "思考表達", "流年學業", "流年・學業"] },
  { id: "family", title: "家人", aliases: ["父母", "子女", "兄弟", "兄弟朋輩", "朋輩", "交友", "流年父母", "流年兄弟", "流年朋輩", "流年子女", "流年・父母", "流年・兄弟／手足", "流年・朋輩", "流年・子女"] },
  { id: "home", title: "田宅", aliases: ["田宅", "外出／遷移", "遷移", "流年田宅", "流年・田宅／家居"] },
  { id: "life", title: "人生節奏", aliases: ["早年到晚年", "精神福德", "福德", "情緒", "情緒／內在", "輪廓", "輪廓／定義", "內在權威", "權威", "流年總論", "口語綜合", "十年大運", "大運"] },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function loadAllResults(): StoredModuleResult[] {
  if (!canUseStorage()) return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredModuleResult[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && r.moduleId && Array.isArray(r.sections));
  } catch {
    return [];
  }
}

function writeAll(list: StoredModuleResult[]) {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}

/** Save a template reading; strips any accidental PII fields. */
export function saveModuleReading(moduleId: ModuleId, reading: TemplateReading) {
  const entry: StoredModuleResult = {
    moduleId,
    label: reading.label || MODULE_META[moduleId].label,
    disclaimer: reading.disclaimer || "規則／模板解讀・文化參考",
    sections: (reading.sections || []).map((s) => ({
      key: String(s.key || ""),
      title: String(s.title || ""),
      text: String(s.text || "").slice(0, 6000),
    })),
    savedAt: Date.now(),
  };
  const rest = loadAllResults().filter((r) => r.moduleId !== moduleId);
  writeAll([...rest, entry]);
}

/** Build a TemplateReading-shaped payload from non-standard modules (六爻／姓名). */
export function saveCustomSections(
  moduleId: ModuleId,
  label: string,
  disclaimer: string,
  sections: DomainSection[],
) {
  saveModuleReading(moduleId, { label, disclaimer, sections });
}

export function clearModuleResult(moduleId: ModuleId) {
  writeAll(loadAllResults().filter((r) => r.moduleId !== moduleId));
}

export function clearAllResults() {
  if (!canUseStorage()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function findSectionText(result: StoredModuleResult, domainId: string): string | null {
  const domain = COMPARE_DOMAINS.find((d) => d.id === domainId);
  if (!domain) return null;
  const aliasSet = new Set(domain.aliases);
  const hit = result.sections.find(
    (s) => aliasSet.has(s.key) || aliasSet.has(s.title) || domain.aliases.some((a) => s.title.includes(a) || s.key.includes(a)),
  );
  return hit ? hit.text : null;
}
