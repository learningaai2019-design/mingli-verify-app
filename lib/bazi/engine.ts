/**
 * 八字排盘 + 規則／模板解讀
 * Uses lunar-javascript for 四柱; optional true solar via lng.
 */
import { Solar } from "lunar-javascript";
import { calculateTrueSolar, BRANCH_NAMES } from "@/lib/shared/true-solar";
import type { BirthInput, TemplateReading, DomainSection } from "@/lib/shared/types";

export interface BaziPillar {
  stem: string;
  branch: string;
  nayin: string;
  hiddenStems: string[];
}

export interface BaziChart {
  year: BaziPillar;
  month: BaziPillar;
  day: BaziPillar;
  hour: BaziPillar;
  dayMaster: string;
  dayMasterElement: string;
  gender: string;
  solarUsed: { year: number; month: number; day: number; hour: number; minute: number };
  trueSolarNote?: string;
  shishen: Record<string, string>;
}

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

function asStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "object" && v !== null && "toArray" in v && typeof (v as { toArray: () => unknown }).toArray === "function") {
    return asStringArray((v as { toArray: () => unknown }).toArray());
  }
  return [String(v)];
}

function pillarFromGanZhi(gz: string, nayin: string, hidden: string[]): BaziPillar {
  return { stem: gz[0], branch: gz[1], nayin, hiddenStems: hidden };
}

export function computeBazi(input: BirthInput): BaziChart {
  let y = input.year, m = input.month, d = input.day, h = input.hour, mi = input.minute;
  let trueSolarNote: string | undefined;
  if (input.useTrueSolar && input.lng !== undefined) {
    const ts = calculateTrueSolar({ year: y, month: m, day: d, hour: h, minute: mi, longitude: input.lng });
    if (ts.dayOffset !== 0) {
      const dt = new Date(Date.UTC(y, m - 1, d + ts.dayOffset));
      y = dt.getUTCFullYear(); m = dt.getUTCMonth() + 1; d = dt.getUTCDate();
    }
    h = ts.hour; mi = ts.minute;
    trueSolarNote = `已套用真太陽時（經度 ${input.lng}°，修正約 ${ts.totalCorrectionMinutes.toFixed(1)} 分鐘；時辰支 ${BRANCH_NAMES[ts.branch]}）`;
  }
  const solar = Solar.fromYmdHms(y, m, d, h, mi, 0);
  const lunar = solar.getLunar();
  const eight = lunar.getEightChar();
  const yearGZ = eight.getYear();
  const monthGZ = eight.getMonth();
  const dayGZ = eight.getDay();
  const timeGZ = eight.getTime();
  const year = pillarFromGanZhi(yearGZ, eight.getYearNaYin(), asStringArray(eight.getYearHideGan()));
  const month = pillarFromGanZhi(monthGZ, eight.getMonthNaYin(), asStringArray(eight.getMonthHideGan()));
  const day = pillarFromGanZhi(dayGZ, eight.getDayNaYin(), asStringArray(eight.getDayHideGan()));
  const hour = pillarFromGanZhi(timeGZ, eight.getTimeNaYin(), asStringArray(eight.getTimeHideGan()));
  const dayMaster = day.stem;
  const shishen: Record<string, string> = {
    年干: shishenOf(dayMaster, year.stem),
    月干: shishenOf(dayMaster, month.stem),
    時干: shishenOf(dayMaster, hour.stem),
    年支主氣: shishenOf(dayMaster, year.hiddenStems[0] || year.stem),
    月支主氣: shishenOf(dayMaster, month.hiddenStems[0] || month.stem),
    日支主氣: shishenOf(dayMaster, day.hiddenStems[0] || day.stem),
    時支主氣: shishenOf(dayMaster, hour.hiddenStems[0] || hour.stem),
  };
  return {
    year, month, day, hour,
    dayMaster,
    dayMasterElement: STEM_ELEMENT[dayMaster] || "—",
    gender: input.gender === "male" ? "乾造" : "坤造",
    solarUsed: { year: y, month: m, day: d, hour: h, minute: mi },
    trueSolarNote,
    shishen,
  };
}

const DOMAIN_KEYS = [
  ["性格", "性格"], ["學業", "學業"], ["事業", "事業"], ["財帛", "財帛"],
  ["田宅", "田宅"], ["父母", "父母"], ["兄弟", "兄弟"], ["朋輩", "朋輩"],
  ["夫妻", "夫妻"], ["子女", "子女"], ["健康", "健康"], ["早年到晚年", "早年到晚年"],
] as const;

function elementTone(el: string) {
  const map: Record<string, string> = {
    木: "生長、伸展、仁慈而好動",
    火: "明朗、熱誠、表現欲強",
    土: "穩重、承載、重信義",
    金: "果斷、規則、重名實",
    水: "靈活、智慧、善變通",
  };
  return map[el] || "調和五行";
}

export function baziTemplateReading(chart: BaziChart, liunianYear?: number): TemplateReading {
  const el = chart.dayMasterElement;
  const ss = Object.values(chart.shishen).join("、");
  const hasWealth = ss.includes("財");
  const hasOfficer = ss.includes("官") || ss.includes("殺");
  const hasPrint = ss.includes("印");
  const hasOutput = ss.includes("食") || ss.includes("傷");

  const sections: DomainSection[] = DOMAIN_KEYS.map(([key, title]) => {
    let text = "";
    switch (key) {
      case "性格":
        text = `日主${chart.dayMaster}屬${el}，氣質偏「${elementTone(el)}」。月令${chart.month.branch}為提綱，性格基調受月令影響最明顯。十神分佈見：${ss}。此為規則模板，實際仍需結合用神喜忌。`;
        break;
      case "學業":
        text = hasPrint
          ? "印星透干或坐支，利文思與系統學習；宜穩定進修路徑。"
          : hasOutput
            ? "食傷較顯，表達與實作學習較強；考試類宜補印星年份。"
            : "學業線平穩，宜按興趣深耕一技。";
        break;
      case "事業":
        text = hasOfficer
          ? "官殺相關較顯，適合有架構、責任或管理色彩嘅工作。"
          : hasOutput
            ? "食傷生財傾向，適合創作、技術輸出、自由專業。"
            : "事業宜穩中求進，忌頻繁跳槽而無累積。";
        break;
      case "財帛":
        text = hasWealth
          ? "財星有氣，理財意識較強；仍要睇財星是否受制。"
          : "財星不顯時，宜以技能換財，勿投機。";
        break;
      case "田宅":
        text = `田宅與日支、妻財宮相關。日支${chart.day.branch}（${chart.day.nayin}）反映居家氣場基調；遷居宜選令日主得生扶之地。`;
        break;
      case "父母":
        text = `年柱${chart.year.stem}${chart.year.branch}主祖上父母宮意象；印星${hasPrint ? "有力，得長輩提攜機會較高" : "不顯，宜自力更生並維繫溝通"}。`;
        break;
      case "兄弟":
        text = `月柱與比劫主兄弟朋輩。比劫${ss.includes("比") || ss.includes("劫") ? "較顯，手足緣份／競爭並存" : "不顯，獨立性強"}。`;
        break;
      case "朋輩":
        text = "朋輩運同比劫、食傷互動；宜擇能互相成就者，忌酒肉應酬過度耗身。";
        break;
      case "夫妻":
        text = inputGenderSpouse(chart);
        break;
      case "子女":
        text = hasOutput || hasOfficer
          ? "子女星（食傷／官殺視性別）有氣，親子互動主題明確；教養宜剛柔並濟。"
          : "子女線平穩，重陪伴質量多於數量。";
        break;
      case "健康":
        text = `日主${el}，養生宜平衡所剋與生我者。火土金水木過旺或過弱皆宜作息調節；此段唔構成醫療建議。`;
        break;
      case "早年到晚年":
        text = `早年看年柱${chart.year.stem}${chart.year.branch}，青年看月柱${chart.month.stem}${chart.month.branch}，中年看日支，晚年看時柱${chart.hour.stem}${chart.hour.branch}。整體敘事為文化參考模板。`;
        break;
      default:
        text = "—";
    }
    return { key, title, text };
  });

  if (liunianYear) {
    sections.push(...liunianSections(chart, liunianYear));
  }

  return {
    label: "規則／模板解讀・文化參考",
    disclaimer: "唔係必然準確之斷語；僅供顧問核對排盤與敘事結構。禁止作為醫療、投資、法律依據。",
    sections,
  };
}

function inputGenderSpouse(chart: BaziChart) {
  const female = chart.gender === "坤造";
  if (female) {
    return "坤造以官殺為夫星。官殺透顯則配偶主題較明確；喜用需結合日主強弱，忌絕對化。";
  }
  return "乾造以財為妻星。財星有氣則配偶／伴侶主題較清晰；仍須看財是否被劫奪。";
}

function liunianSections(chart: BaziChart, year: number): DomainSection[] {
  const solar = Solar.fromYmd(year, 6, 1);
  const ygz = solar.getLunar().getEightChar().getYear();
  const stem = ygz[0];
  const branch = ygz[1];
  const rel = shishenOf(chart.dayMaster, stem);
  const noble = ["正官", "正印", "正財", "食神"].includes(rel);
  const petty = ["七殺", "劫財", "傷官"].includes(rel);
  const months = ["正月寅", "二月卯", "三月辰", "四月巳", "五月午", "六月未", "七月申", "八月酉", "九月戌", "十月亥", "冬月子", "臘月丑"];
  const monthNotes = months.map((label, i) => {
    const be = BRANCH_ELEMENT[label.slice(-1)] || "土";
    const dm = chart.dayMasterElement;
    let tip = "平穩";
    if (be === dm || GENERATE[be] === dm) tip = "相對得令／得生，可積極推進";
    else if (CONTROL[be] === dm) tip = "壓力較大，宜守不宜攻";
    else if (CONTROL[dm] === be) tip = "出力換成果，注意過勞";
    return `${label}：${tip}`;
  }).join("；");

  return [
    {
      key: "流年總論",
      title: `流年 ${year}（${ygz}）`,
      text: `流年干對日主為「${rel}」。${noble ? "偏向貴人／資源主題較易出現。" : petty ? "小人／爭奪／口舌主題需提高警覺。" : "中性流年，重在自身節奏。"}貴人特徵：穩重守信、能指引規則者。小人特徵：情緒化操弄、散播是非者。`,
    },
    {
      key: "逐月旺衰",
      title: "逐月旺衰注意",
      text: monthNotes + "。（按日主五行與月支五行生剋做粗模板，非細盤）",
    },
  ];
}
