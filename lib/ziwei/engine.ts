/**
 * 紫微排盘 via iztro + 規則／模板解讀（公開流派參考，唔聲稱倪師授權）
 */
import { astro } from "iztro";
import type { BirthInput, TemplateReading, DomainSection } from "@/lib/shared/types";
import { calculateTrueSolar, BRANCH_NAMES } from "@/lib/shared/true-solar";

export interface ZiweiPalaceView {
  name: string;
  earthlyBranch: string;
  majorStars: string[];
  minorStars: string[];
  isMing?: boolean;
  isShen?: boolean;
}

export interface ZiweiChartView {
  gender: string;
  fiveElementsClass: string;
  soul: string;
  body: string;
  palaces: ZiweiPalaceView[];
  timeIndex: number;
  trueSolarNote?: string;
  schoolNote: string;
}

function hourToTimeIndex(hour: number, minute: number): number {
  // iztro: 0=早子 23:00-01:00 ... roughly 2h slots from 23
  const mins = hour * 60 + minute;
  if (mins >= 23 * 60 || mins < 60) return 0;
  return Math.floor((mins - 60) / 120) + 1;
}

export function computeZiwei(input: BirthInput): ZiweiChartView {
  let y = input.year, m = input.month, d = input.day, h = input.hour, mi = input.minute;
  let trueSolarNote: string | undefined;
  if (input.useTrueSolar && input.lng !== undefined) {
    const ts = calculateTrueSolar({ year: y, month: m, day: d, hour: h, minute: mi, longitude: input.lng });
    if (ts.dayOffset !== 0) {
      const dt = new Date(Date.UTC(y, m - 1, d + ts.dayOffset));
      y = dt.getUTCFullYear(); m = dt.getUTCMonth() + 1; d = dt.getUTCDate();
    }
    h = ts.hour; mi = ts.minute;
    trueSolarNote = `真太陽時已校正；時辰 ${BRANCH_NAMES[ts.branch]}時`;
  }
  const timeIndex = hourToTimeIndex(h, mi);
  const dateStr = `${y}-${m}-${d}`;
  const gender = input.gender === "male" ? "男" : "女";
  // iztro bySolar
  const chart = astro.bySolar(dateStr, timeIndex, gender, true, "zh-TW");
  const palaces: ZiweiPalaceView[] = (chart.palaces || []).map((p: {
    name: string;
    earthlyBranch: string;
    majorStars?: { name: string }[];
    minorStars?: { name: string }[];
    adjectiveStars?: { name: string }[];
    isOriginalPalace?: boolean;
    isBodyPalace?: boolean;
  }) => ({
    name: p.name,
    earthlyBranch: p.earthlyBranch,
    majorStars: (p.majorStars || []).map((s) => s.name),
    minorStars: [...(p.minorStars || []), ...(p.adjectiveStars || [])].map((s) => s.name).slice(0, 8),
    isMing: p.isOriginalPalace || p.name === "命宮",
    isShen: p.isBodyPalace || p.name === "身宮",
  }));

  return {
    gender,
    fiveElementsClass: chart.fiveElementsClass || "",
    soul: chart.soul || "",
    body: chart.body || "",
    palaces,
    timeIndex,
    trueSolarNote,
    schoolNote: "排盘引擎：iztro（中州派常見參數）。解讀為本應用自研規則模板，並非倪海廈體系授權或原解讀數據集。",
  };
}

const ZIWEI_DOMAINS: { palace: string; title: string }[] = [
  { palace: "命宮", title: "性格／命主" },
  { palace: "兄弟", title: "兄弟朋輩" },
  { palace: "夫妻", title: "夫妻" },
  { palace: "子女", title: "子女" },
  { palace: "財帛", title: "財帛" },
  { palace: "疾厄", title: "健康" },
  { palace: "遷移", title: "外出／遷移" },
  { palace: "交友", title: "交友" },
  { palace: "官祿", title: "事業" },
  { palace: "田宅", title: "田宅" },
  { palace: "福德", title: "精神福德" },
  { palace: "父母", title: "父母" },
];

function starBlurb(stars: string[]): string {
  if (!stars.length) return "本宮無主星，借對宮論事，性格較彈性。";
  const s = stars.join("、");
  if (stars.some((x) => x.includes("紫微"))) return `主星${s}：領導與自尊主題較強。`;
  if (stars.some((x) => x.includes("天機"))) return `主星${s}：思慮機變、計劃性強。`;
  if (stars.some((x) => x.includes("太陽"))) return `主星${s}：外放、貴氣、需注意消耗。`;
  if (stars.some((x) => x.includes("武曲"))) return `主星${s}：務實果斷、財星意象。`;
  if (stars.some((x) => x.includes("天同"))) return `主星${s}：享樂溫和、不宜過逸。`;
  if (stars.some((x) => x.includes("廉貞"))) return `主星${s}：情感張力、是非與二次機會。`;
  if (stars.some((x) => x.includes("天府"))) return `主星${s}：穩守庫星、節制為貴。`;
  if (stars.some((x) => x.includes("太陰"))) return `主星${s}：內斂細膩、夜間／不動產意象。`;
  if (stars.some((x) => x.includes("貪狼"))) return `主星${s}：欲望、才藝、社交魅力。`;
  if (stars.some((x) => x.includes("巨門"))) return `主星${s}：口才、爭議、真相探尋。`;
  if (stars.some((x) => x.includes("天相"))) return `主星${s}：輔佐、形象、禮儀。`;
  if (stars.some((x) => x.includes("天梁"))) return `主星${s}：清貴蔭庇、長輩緣。`;
  if (stars.some((x) => x.includes("七殺"))) return `主星${s}：開創衝鋒、壓力轉化為成就。`;
  if (stars.some((x) => x.includes("破軍"))) return `主星${s}：破舊立新、變動大。`;
  return `主星${s}：按宮位職能發揮。`;
}

export function ziweiTemplateReading(chart: ZiweiChartView): TemplateReading {
  const byName = Object.fromEntries(chart.palaces.map((p) => [p.name, p]));
  const sections: DomainSection[] = ZIWEI_DOMAINS.map(({ palace, title }) => {
    const p = byName[palace] || byName[palace + "宮"];
    const stars = p?.majorStars || [];
    const branch = p?.earthlyBranch || "—";
    return {
      key: palace,
      title,
      text: `${palace}（${branch}）：${starBlurb(stars)}${p?.minorStars?.length ? ` 輔星見 ${p.minorStars.slice(0, 5).join("、")}。` : ""}`,
    };
  });
  sections.unshift({
    key: "總論",
    title: "盤面總論",
    text: `五行局：${chart.fiveElementsClass || "—"}；命主 ${chart.soul}、身主 ${chart.body}。${chart.schoolNote}`,
  });
  return {
    label: "規則／模板解讀・文化參考",
    disclaimer: "紫微解讀為模板引擎，披露流派為 iztro／中州派常見排盘參數；非任何特定名師授權教材。",
    sections,
  };
}
