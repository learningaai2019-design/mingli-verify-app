/**
 * 紫微排盘 via iztro + 規則／模板解讀（公開流派參考，唔聲稱倪師授權）
 */
import { astro } from "iztro";
import type { BirthInput, TemplateReading, DomainSection } from "@/lib/shared/types";
import { calculateTrueSolar, BRANCH_NAMES } from "@/lib/shared/true-solar";

export interface ZiweiSihuaHit {
  star: string;
  hua: "祿" | "權" | "科" | "忌";
  palace: string;
}

export interface ZiweiPalaceView {
  name: string;
  earthlyBranch: string;
  majorStars: string[];
  minorStars: string[];
  /** 本宮主／輔星自帶之四化 */
  sihua?: ZiweiSihuaHit[];
  isMing?: boolean;
  isShen?: boolean;
}

export interface ZiweiChartView {
  gender: string;
  fiveElementsClass: string;
  soul: string;
  body: string;
  palaces: ZiweiPalaceView[];
  /** 全盤四化一覽 */
  sihua: ZiweiSihuaHit[];
  sihuaSummary: string;
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
  type StarLike = { name: string; mutagen?: string };
  const sihuaAll: ZiweiSihuaHit[] = [];
  const palaces: ZiweiPalaceView[] = (chart.palaces || []).map((p: {
    name: string;
    earthlyBranch: string;
    majorStars?: StarLike[];
    minorStars?: StarLike[];
    adjectiveStars?: StarLike[];
    isOriginalPalace?: boolean;
    isBodyPalace?: boolean;
  }) => {
    const starPool: StarLike[] = [
      ...(p.majorStars || []),
      ...(p.minorStars || []),
      ...(p.adjectiveStars || []),
    ];
    const sihua: ZiweiSihuaHit[] = [];
    for (const s of starPool) {
      const h = (s.mutagen || "").trim();
      if (h === "祿" || h === "權" || h === "科" || h === "忌") {
        const hit: ZiweiSihuaHit = { star: s.name, hua: h, palace: p.name };
        sihua.push(hit);
        sihuaAll.push(hit);
      }
    }
    return {
      name: p.name,
      earthlyBranch: p.earthlyBranch,
      majorStars: (p.majorStars || []).map((s) => s.name),
      minorStars: [...(p.minorStars || []), ...(p.adjectiveStars || [])].map((s) => s.name).slice(0, 8),
      sihua,
      isMing: p.isOriginalPalace || p.name === "命宮",
      isShen: p.isBodyPalace || p.name === "身宮",
    };
  });

  const sihuaSummary = sihuaAll.length
    ? "本盤四化：" + sihuaAll.map((s) => `${s.palace}${s.star}化${s.hua}`).join("；") + "。讀法提要：化祿看機會資源、化權看主事話語權、化科看名氣文書貴人、化忌看耗神是非——忌要醒神收口，唔等於判災。"
    : "本盤未讀到四化標記（引擎／參數差異）；宮星解讀仍可作人生域核對。";

  return {
    gender,
    fiveElementsClass: chart.fiveElementsClass || "",
    soul: chart.soul || "",
    body: chart.body || "",
    palaces,
    sihua: sihuaAll,
    sihuaSummary,
    timeIndex,
    trueSolarNote,
    schoolNote: "排盘引擎：iztro（中州派常見參數）。解讀為本應用自研規則模板，並非倪海廈體系授權或原解讀數據集。含宮星＋四化人生域。",
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


function starPersonVoice(stars: string[]): string {
  if (!stars.length) return "本宮無主星、多借對宮——彈性大，亦容易「睇情況先定」，要自己立主心骨。";
  const s = stars.join("、");
  if (stars.some((x) => x.includes("天同") && stars.some((y) => y.includes("太陰")))) {
    return `主星${s}：要舒適、情感細、記恩亦記唔舒服；外表可柔，內裡要有份話事權，唔肯完全交權。`;
  }
  if (stars.some((x) => x.includes("紫微"))) return `主星${s}：自尊同領導欲較顯，要被尊重，亦要學聽人完場再決。`;
  if (stars.some((x) => x.includes("天機"))) return `主星${s}：腦快、愛計劃、易改方案；精準同內耗只差一線，交付日要敢停。`;
  if (stars.some((x) => x.includes("太陽"))) return `主星${s}：外放有光，亦易耗——被看見嘅同時要留休息。`;
  if (stars.some((x) => x.includes("武曲"))) return `主星${s}：務實果斷，錢同結果導向；溝通記得留溫度。`;
  if (stars.some((x) => x.includes("天同"))) return `主星${s}：要舒服、要和氣，忌長期被催到無喘息；適度享樂可以，過逸會悶。`;
  if (stars.some((x) => x.includes("廉貞"))) return `主星${s}：情感張力、二次機會同是非都可能近身；界線要清。`;
  if (stars.some((x) => x.includes("天府"))) return `主星${s}：穩守、節制、庫星味道；少為面子撐場面。`;
  if (stars.some((x) => x.includes("太陰"))) return `主星${s}：內斂細膩，夜間思緒活躍；不動產／家庭安全感對你重要。`;
  if (stars.some((x) => x.includes("貪狼"))) return `主星${s}：好奇、多欲（學問／美／關係／機會），一生難「無慾」，宜導向才藝同專業。`;
  if (stars.some((x) => x.includes("巨門"))) return `主星${s}：口才同爭議並存，真相探尋強；講真話前留一夜更穩。`;
  if (stars.some((x) => x.includes("天相"))) return `主星${s}：輔佐、形象、禮儀；適合協調，忌只做和事佬無立場。`;
  if (stars.some((x) => x.includes("天梁"))) return `主星${s}：有原則、長輩緣、被人指望；小心變成成日幫人善後抽唔到身。`;
  if (stars.some((x) => x.includes("七殺"))) return `主星${s}：開創衝鋒，壓力可轉成就；平順時反而要自找目標。`;
  if (stars.some((x) => x.includes("破軍"))) return `主星${s}：破舊立新、變動大；換交貨方式，唔好當世界末日。`;
  return `主星${s}：按宮位職能發揮，重在你點樣用，而唔係標籤本身。`;
}

function palaceAdvice(palace: string, stars: string[]): string {
  const soft = starPersonVoice(stars);
  const map: Record<string, string> = {
    命宮: "性格底色喺呢度——你做決定時返覆出現嘅節奏，多過一句「好定壞」。",
    兄弟: "手足同近朋：有緣亦要界線；錢銀合作寫低。",
    夫妻: "親密關係要講責任同名份；戰友式溝通，好過互相用腦審。",
    子女: "親職或你交出去嘅作品／團隊——標準高可以，支援要跟到。",
    財帛: "錢同「被需要／被聽到」有時綁埋；有價、有單、有程序。",
    疾厄: "只係作息同身體提醒；有事睇醫生，呢度唔係診斷。",
    遷移: "外出、變動、他鄉機會——行之前問自己係開拓定逃避。",
    交友: "朋友圈篩選：出事現身大過熱鬧；新識三個月內唔好大額往來。",
    官祿: "事業腦同理想；想得多就要有交付日，留得住累積資產。",
    田宅: "家居要瞓得著、有安全感；合約自己覆核。",
    福德: "精神帳：夜間思緒、觀念輸出——留空白，先唔會耗乾。",
    父母: "長輩緣同求助渠道；坦誠開口，同時回報心意。",
  };
  return `${soft}${map[palace] || "按宮位職能，配合人生核對。"}`;
}

export function ziweiTemplateReading(chart: ZiweiChartView): TemplateReading {
  const byName = Object.fromEntries(chart.palaces.map((p) => [p.name, p]));
  const sections: DomainSection[] = ZIWEI_DOMAINS.map(({ palace, title }) => {
    const p = byName[palace] || byName[palace + "宮"];
    const stars = p?.majorStars || [];
    const branch = p?.earthlyBranch || "—";
    const minor = p?.minorStars?.length ? `輔星見 ${p.minorStars.slice(0, 5).join("、")}，可作細節提示，唔使迷信。` : "";
    const sihua = (p?.sihua || []).length
      ? `四化：${(p!.sihua || []).map((s) => `${s.star}化${s.hua}`).join("、")}。`
      : "";
    return {
      key: palace,
      title,
      text: `${palace}（${branch}）：${palaceAdvice(palace, stars)}${sihua}${minor}`,
    };
  });
  sections.unshift({
    key: "四化人生域",
    title: "四化 × 人生域",
    text: chart.sihuaSummary || "四化資料未齊。",
  });
  sections.unshift({
    key: "總論",
    title: "盤面總論",
    text: `五行局：${chart.fiveElementsClass || "—"}；命主 ${chart.soul}、身主 ${chart.body}。若用生活語言：呢張盤講緊你點樣要舒適又要話事、點樣用腦力多過蠻力行人生。宮星看性情同領域，四化看「動力點／耗神點」——兩者合參先似顧問傾偈，唔係淨報星名。${chart.schoolNote}`,
  });
  const ming = byName["命宮"] || byName["命"];
  const mingStars = (ming?.majorStars || []).join("、") || "借對宮";
  const cai = byName["財帛"] || byName["財帛宮"];
  const guan = byName["官祿"] || byName["官祿宮"];
  sections.push({
    key: "口語綜合",
    title: "口語綜合",
    text: [
      `講真，望住呢張紫微盤，我會把你講成一個「命主 ${chart.soul}、身主 ${chart.body}」底色嘅人——五行局${chart.fiveElementsClass || "未明"}，命宮主星約係${mingStars}。呢啲唔係貼紙，而係你日常做決定時會返嚟嘅節奏：要美、要對、要有份話事，亦要安全感。`,
      `事業（官祿見 ${(guan?.majorStars || []).join("、") || "借對宮"}）同財帛（${(cai?.majorStars || []).join("、") || "借對宮"}）提醒你：有架構就守交付，有庫就節制；自我價值若同「被聽到／被需要」綁埋，就要用專業同收費程序托住，唔好淨靠感覺。`,
      `感情同父母線靠坦白溝通多過靠猜；健康方面疾厄宮只係提醒作息，有事睇醫生。`,
      `最後一句：紫微係文化地圖。你肯做嘅小步驟——回覆訊息、規律睡眠、錢銀寫低、把想法收成可交付成品——往往比任何「必準」斷語更改寫今年結局。我寧願你用人生核對，多過我扮好準。`,
    ].join("\n\n"),
  });
  return {
    label: "規則／顧問口語解讀・文化參考",
    disclaimer: "紫微解讀為規則引擎，披露流派為 iztro／中州派常見排盘參數；非任何特定名師授權教材。文化參考，唔作必準保證。",
    sections,
  };
}
