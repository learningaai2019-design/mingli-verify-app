/**
 * 跟進詢問：重用已排好嘅八字盤／大運／流年，產出聚焦顧問口語分析。
 * 唔另開隨機功能農場——只答與盤面相關嘅具體問題。
 */
import { Solar } from "lunar-javascript";
import type { BaziChart, DayunStep } from "./engine";
import type { DomainSection, TemplateReading } from "@/lib/shared/types";

const STEM_ELEMENT: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土",
  庚: "金", 辛: "金", 壬: "水", 癸: "水",
};
const BRANCH_ELEMENT: Record<string, string> = {
  寅: "木", 卯: "木", 巳: "火", 午: "火", 辰: "土", 戌: "土", 丑: "土", 未: "土",
  申: "金", 酉: "金", 亥: "水", 子: "水",
};
const GENERATE: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROL: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

function shishenOf(dayStem: string, other: string): string {
  const dm = STEM_ELEMENT[dayStem];
  const ot = STEM_ELEMENT[other];
  if (!dm || !ot) return "—";
  const yangDay = "甲丙戊庚壬".includes(dayStem);
  const yangOther = "甲丙戊庚壬".includes(other);
  const same = yangDay === yangOther;
  if (ot === dm) return same ? "比肩" : "劫財";
  if (GENERATE[dm] === ot) return same ? "食神" : "傷官";
  if (GENERATE[ot] === dm) return same ? "偏印" : "正印";
  if (CONTROL[dm] === ot) return same ? "偏財" : "正財";
  if (CONTROL[ot] === dm) return same ? "七殺" : "正官";
  return "—";
}

function findDayunForYear(chart: BaziChart, year: number): DayunStep | undefined {
  return chart.dayun?.steps?.find((s) => year >= s.startYear && year <= s.endYear);
}

function extractYears(q: string): number[] {
  const years: number[] = [];
  const re = /(19|20)\d{2}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(q))) {
    const y = parseInt(m[0], 10);
    if (y >= 1900 && y <= 2100) years.push(y);
  }
  return [...new Set(years)];
}

type Topic =
  | "dayun"
  | "liunian"
  | "love"
  | "career"
  | "wealth"
  | "health"
  | "family"
  | "personality"
  | "general";

function detectTopics(q: string): Topic[] {
  const topics: Topic[] = [];
  if (/大運|十年|呢運|今運|現運|行運/.test(q)) topics.push("dayun");
  if (/流年|今年|呢年|嗰年|月份|逐月|流月/.test(q)) topics.push("liunian");
  if (/感情|婚姻|夫妻|姻緣|拍拖|伴侶|恋爱|戀愛/.test(q)) topics.push("love");
  if (/事業|工作|就業|升遷|轉工|職場|事業線/.test(q)) topics.push("career");
  if (/財|錢|收入|投資|財運/.test(q)) topics.push("wealth");
  if (/健康|身體|病|睡眠|養生/.test(q)) topics.push("health");
  if (/父母|兄弟|子女|家人|手足|朋輩|朋友/.test(q)) topics.push("family");
  if (/性格|脾氣|個性|人品|十神|格局|用神/.test(q)) topics.push("personality");
  if (!topics.length) topics.push("general");
  return topics;
}

function dayunFocus(step: DayunStep, topics: Topic[]): string {
  const label = !step.ganZhi || step.ganZhi === "（起運前）" ? "起運前" : `${step.ganZhi}大運`;
  const head = `${step.startYear}–${step.endYear}（約${step.startAge}–${step.endAge}歲）${label}${step.stemShishen && step.stemShishen !== "—" ? `（十神${step.stemShishen}）` : ""}。`;
  const bits: string[] = [head];
  if (topics.includes("love") || topics.includes("general") || topics.includes("dayun")) {
    bits.push(`感情：${step.brief.love}`);
  }
  if (topics.includes("career") || topics.includes("general") || topics.includes("dayun")) {
    bits.push(`事業：${step.brief.career}`);
  }
  if (topics.includes("wealth") || topics.includes("general") || topics.includes("dayun")) {
    bits.push(`財：${step.brief.wealth}`);
  }
  if (topics.includes("health") || topics.includes("general") || topics.includes("dayun")) {
    bits.push(`健康：${step.brief.health}`);
  }
  if (topics.includes("personality") || topics.includes("dayun")) {
    bits.push(`心態：${step.brief.personality}`);
  }
  bits.push("記住：大運係十年舞台，流年係一年戲；大事核對宜對年份落喺邊一步。文化參考，唔作必準保證。");
  return bits.join("\n\n");
}

function liunianFocus(chart: BaziChart, year: number, topics: Topic[]): string {
  const ygz = Solar.fromYmd(year, 6, 1).getLunar().getEightChar().getYear();
  const stem = ygz[0];
  const branch = ygz[1];
  const rel = shishenOf(chart.dayMaster, stem);
  const be = BRANCH_ELEMENT[branch] || "土";
  const covering = findDayunForYear(chart, year);
  const paras: string[] = [];
  paras.push(
    `${year}年（${ygz}）流年干對日主${chart.dayMaster}為「${rel}」，年支${branch}（${be}）。${covering ? `呢年落喺${covering.ganZhi === "（起運前）" ? "起運前" : covering.ganZhi + "大運"}（${covering.startYear}–${covering.endYear}）舞台上。` : ""}`,
  );
  if (topics.includes("career") || topics.includes("general") || topics.includes("liunian")) {
    if (["食神", "傷官"].includes(rel)) {
      paras.push("事業：適合公開輸出、改方案、教學顧問；檔期易滿——講完就收、交付就停。");
    } else if (["正官", "七殺"].includes(rel)) {
      paras.push("事業：有架構／要拍板嘅場合較入戲；升遷轉工揀責任清晰，忌無意義鬥爭。");
    } else {
      paras.push("事業：穩守基本盤，把現有工種做到可量化成績，年底再盤點。");
    }
  }
  if (topics.includes("love") || topics.includes("general") || topics.includes("liunian")) {
    if (chart.gender === "坤造" && ["正官", "七殺"].includes(rel)) {
      paras.push("感情：伴侶／姻緣戲份較明顯；已有伴宜坦白少猜疑，未有伴可擴社交但唔好急承諾。");
    } else if (["食神", "傷官"].includes(rel)) {
      paras.push("感情：場合多、話題多——記得留「無目的相處」；火氣上臉時隔夜再回。");
    } else {
      paras.push("感情：重日常經營多過儀式；期望講出口，有矛盾當日清。");
    }
  }
  if (topics.includes("wealth") || topics.includes("general")) {
    if (["正財", "偏財"].includes(rel)) {
      paras.push("財：進帳同決策一齊嚟；大額留一夜，有價有單有冷靜。");
    } else if (["傷官", "劫財"].includes(rel)) {
      paras.push("財：錢同面子易一齊晃；合作寫合約，守信譽大過單次風光。");
    } else {
      paras.push("財：以技能換現金，少追來路不明嘅「必賺」。");
    }
  }
  if (topics.includes("health") || topics.includes("general")) {
    paras.push(`健康：日主${chart.dayMasterElement}喺${branch}年，${["傷官", "食神", "七殺"].includes(rel) ? "輸出／壓力年——睡眠肩頸優先。" : "維持作息即可。"}唔適求醫，呢度唔係診斷。`);
  }
  paras.push("實用：全年宜計劃寫低、錢銀分開、界線當紀律。以上屬文化參考。");
  return paras.join("\n\n");
}

function natalDomainFocus(chart: BaziChart, topics: Topic[]): string {
  const sh = chart.shishen;
  const bits: string[] = [
    `原局：${chart.gender}日主${chart.dayMaster}（${chart.dayMasterElement}）；四柱 ${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}。`,
    `十神提要：月干${sh["月干"]}、時干${sh["時干"]}、日支主氣${sh["日支主氣"]}、年干${sh["年干"]}。`,
  ];
  if (topics.includes("love") || topics.includes("general")) {
    bits.push(
      chart.gender === "坤造"
        ? `感情底色看日支${chart.day.branch}：你傾向要穩、有能力、肯講責任同名份嘅人；細膩歸細膩，亦一眼睇穿——務實溝通比腦補重要。`
        : `感情底色看日支${chart.day.branch}：親密關係要講清楚期望；錢同愛分開傾。`,
    );
  }
  if (topics.includes("career") || topics.includes("general")) {
    const vals = Object.values(sh).join("、");
    if (vals.includes("傷官") || vals.includes("食神")) {
      bits.push("事業：適合「因為識先有位」——顧問、改系統、教學、品質把關；有期限反而醒神，最耗係無話語權。");
    } else if (vals.includes("正官") || vals.includes("七殺")) {
      bits.push("事業：扛得住架構同責任；升遷靠交付同口碑，揀責任清晰多過好聽 title。");
    } else {
      bits.push("事業：穩中求進，每份工榨乾可帶走技能再跳。");
    }
  }
  if (topics.includes("family")) {
    bits.push(`家人：年柱${chart.year.stem}${chart.year.branch}連父母意象；時柱${chart.hour.stem}${chart.hour.branch}看子女／交出去嘅生命。界線同坦誠並行。`);
  }
  if (topics.includes("personality")) {
    bits.push("性格／格局：請一併參閱主解讀入面「十神總覽」「格局傾向」「用神框架」——跟進只係聚焦，唔取代成篇一生批。");
  }
  bits.push("若想再深挖某步大運或某一年，直接寫年份或「而家呢運」即可。");
  return bits.join("\n\n");
}

/** 根據問題同已計算盤面，產出聚焦跟進解讀 */
export function answerBaziFollowUp(chart: BaziChart, question: string): TemplateReading {
  const q = (question || "").trim().slice(0, 500);
  if (!q) {
    return {
      label: "跟進詢問・文化參考",
      disclaimer: "請輸入具體問題（例如某步大運、某一年、感情／事業）。",
      sections: [{ key: "跟進", title: "跟進", text: "問題空白——寫低你想聚焦邊十年、邊年、定邊個人生域。" }],
    };
  }
  const topics = detectTopics(q);
  const years = extractYears(q);
  const sections: DomainSection[] = [];
  sections.push({
    key: "所問",
    title: "你問",
    text: q,
  });

  const nowY = new Date().getFullYear();
  const wantDayun = topics.includes("dayun") || /呢運|今運|現運|而家/.test(q);
  const wantYear = topics.includes("liunian") || years.length > 0;

  if (wantDayun || (years.length && !topics.includes("liunian"))) {
    const targetYears = years.length ? years : [nowY];
    for (const y of targetYears) {
      const step = findDayunForYear(chart, y);
      if (step) {
        sections.push({
          key: `跟進大運${step.index}`,
          title: `聚焦・大運（覆蓋 ${y}）`,
          text: dayunFocus(step, topics),
        });
      }
    }
    // 若問「十年大運」而無年份，列出現運
    if (!years.length && wantDayun) {
      const step = findDayunForYear(chart, nowY);
      if (step && !sections.some((s) => s.key === `跟進大運${step.index}`)) {
        sections.push({
          key: `跟進大運${step.index}`,
          title: "聚焦・現運／近段大運",
          text: dayunFocus(step, topics),
        });
      }
    }
  }

  if (wantYear || years.length) {
    const ys = years.length ? years : [nowY];
    for (const y of ys) {
      sections.push({
        key: `跟進流年${y}`,
        title: `聚焦・流年 ${y}`,
        text: liunianFocus(chart, y, topics),
      });
    }
  }

  // 人生域／性格等：若未專攻運限，或明確問域
  const domainOnly =
    topics.some((t) => ["love", "career", "wealth", "health", "family", "personality", "general"].includes(t)) &&
    !wantDayun &&
    !wantYear;
  if (domainOnly || topics.includes("personality") || topics.includes("family")) {
    sections.push({
      key: "跟進原局",
      title: "聚焦・原局提要",
      text: natalDomainFocus(chart, topics),
    });
  }

  if (sections.length <= 1) {
    sections.push({
      key: "跟進原局",
      title: "聚焦・綜合",
      text: natalDomainFocus(chart, topics),
    });
  }

  sections.push({
    key: "跟進收束",
    title: "實用收束",
    text: "跟進分析重用你已排好嘅盤同大運／流年框架，唔另起爐灶。命理係文化地圖：小步驟（回覆、記帳、睡眠、可交付成品）往往比「必準」斷語更改寫結局。唔作醫療／投資／法律依據。",
  });

  return {
    label: "跟進詢問・規則／顧問口語・文化參考",
    disclaimer: "基於本 session 已計算之盤面作聚焦分析；非新盤、非保證。文化參考。",
    sections,
  };
}
