/**
 * 六爻：铜钱／手动／时间起卦 + 装卦 + 用神 + 五大纲领风格短判
 * 披露：參考愚人公開線教學結構（一事一問、占卦守則精神），非其商業課內容複製。
 */

export type YaoValue = 6 | 7 | 8 | 9; // 6老阴 7少阳 8少阴 9老阳

export interface HexagramLine {
  value: YaoValue;
  changing: boolean;
  yang: boolean;
  label: string;
}

export interface LiuyaoResult {
  lines: HexagramLine[]; // index 0 = 初爻
  benName: string;
  benBinary: string;
  zhiName?: string;
  zhiBinary?: string;
  /** 用戶原問（一事一問） */
  question: string;
  /** 主題助手（定用神；可選） */
  questionType: string;
  yongShen: string;
  verdict: string;
  programNotes: string[];
  disclaimer: string;
}

export interface LiuyaoRefuse {
  refused: true;
  reason: string;
  question: string;
}

export type LiuyaoOutcome = LiuyaoResult | LiuyaoRefuse;

export function isLiuyaoRefuse(r: LiuyaoOutcome): r is LiuyaoRefuse {
  return (r as LiuyaoRefuse).refused === true;
}

const TRIGRAMS: Record<string, { name: string; nature: string }> = {
  "111": { name: "乾", nature: "天" },
  "011": { name: "兑", nature: "泽" },
  "101": { name: "离", nature: "火" },
  "001": { name: "震", nature: "雷" },
  "110": { name: "巽", nature: "风" },
  "010": { name: "坎", nature: "水" },
  "100": { name: "艮", nature: "山" },
  "000": { name: "坤", nature: "地" },
};

function binaryFromLines(lines: { yang: boolean }[]): string {
  return lines.map((l) => (l.yang ? "1" : "0")).join("");
}

function hexName(bin6: string): string {
  const lower = bin6.slice(0, 3);
  const upper = bin6.slice(3);
  const lo = TRIGRAMS[lower]?.name || "?";
  const up = TRIGRAMS[upper]?.name || "?";
  if (lo === up) return `${up}为${TRIGRAMS[upper]?.nature || ""}`;
  return `${up}${lo}`;
}

export function coinCast(): YaoValue[] {
  const out: YaoValue[] = [];
  for (let i = 0; i < 6; i++) {
    let sum = 0;
    for (let c = 0; c < 3; c++) sum += Math.random() < 0.5 ? 2 : 3;
    out.push(sum as YaoValue);
  }
  return out;
}

/** 时间起卦（简法）：年月日时数取余 — 文化演示用 */
export function timeCast(d = new Date()): YaoValue[] {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const upper = ((y + m + day) % 8) || 8;
  const lower = ((y + m + day + h) % 8) || 8;
  const move = ((y + m + day + h) % 6) || 6;
  const map: Record<number, string> = {
    1: "111", 2: "110", 3: "101", 4: "100", 5: "011", 6: "010", 7: "001", 8: "000",
  };
  const u = map[upper];
  const l = map[lower];
  const bin = (l + u).split("").map((ch, idx) => {
    const yang = ch === "1";
    const changing = idx + 1 === move;
    if (changing) return (yang ? 9 : 6) as YaoValue;
    return (yang ? 7 : 8) as YaoValue;
  });
  return bin;
}

const YONG_SHEN: Record<string, string> = {
  事业: "官鬼为用神",
  事業: "官鬼为用神",
  财运: "妻财为用神",
  財運: "妻财为用神",
  感情: "妻财（问男）／官鬼（问女）为用神；亦可看应爻",
  健康: "世爻／父母为用（视病情）",
  诉讼: "官鬼为用，兄弟为忌",
  訴訟: "官鬼为用，兄弟为忌",
  出行: "父母为用（车船文书），应爻为对方／目的地",
  一般: "世爻为用，应爻为事体",
};

/** 主題助手選項（可選；唔填則由問題推斷或「一般」） */
export const LIUYAO_THEME_OPTIONS = [
  "（自動／一般）",
  "事业",
  "财运",
  "感情",
  "健康",
  "诉讼",
  "出行",
] as const;

/** 犯罪／傷害／不義求財等：拒絕起卦（愚人占卦守則精神 + 現代合規） */
const REFUSE_PATTERNS: { re: RegExp; reason: string }[] = [
  {
    re: /殺|殺人|謀殺|暗殺|下毒|炸彈|爆炸|槍擊|枪杀|傷害他人|傷害人|傷人|打架傷|毆傷|虐打|綁架|勒索|恐嚇殺人/,
    reason: "涉及傷害／暴力意圖，本模組拒絕起卦。請勿以卜卦策劃傷人；若有危機請尋求合法協助。",
  },
  {
    re: /贩毒|販毒|運毒|運毒|種毒|製毒|制毒|毒品交易|槍械走私|走私槍|人口販|販賣人口|拐賣|強姦|性侵|猥褻兒童|虐童/,
    reason: "涉及犯罪／傷害他人，本模組拒絕起卦。",
  },
  {
    re: /詐騙|行騙|騙錢|呃人錢|呃錢|造假帳|造假賬|洗黑錢|洗錢|貪污|受賄|行賄|偷稅|逃稅策劃|盜竊策劃|偷竊計劃|打劫|搶劫|入屋爆竊|黑客入侵|入侵銀行|盜用信用卡/,
    reason: "涉及欺詐／不義求財／違法取利，按占卦守則精神（妄顧道義而求財不可占）拒絕起卦。",
  },
  {
    re: /點樣犯案|如何犯罪|怎麼犯罪|點樣呃人|如何騙人|點樣偷|如何偷到|點樣搶|非法得益|非法致富|走後門行賄/,
    reason: "問題似在求犯罪／不義途徑，本模組拒絕起卦。",
  },
];

export function checkLiuyaoRefuse(question: string): string | null {
  const q = question.trim();
  if (!q) return "請先輸入一事一問嘅具體問題（必填）。";
  for (const { re, reason } of REFUSE_PATTERNS) {
    if (re.test(q)) return reason;
  }
  return null;
}

/** 由自由問題推斷用神主題 */
export function inferThemeFromQuestion(question: string): string {
  const q = question;
  if (/工|職|業|升職|辭|老闆|面試|事業|創業|上司|公司|轉工/.test(q)) return "事业";
  if (/財|錢|投資|生意|收入|賺|虧|財運|加薪|買樓錢/.test(q)) return "财运";
  if (/戀|愛|婚|感情|拍拖|分手|復合|伴侶|配偶|老婆|老公|男友|女友/.test(q)) return "感情";
  if (/病|健康|手術|身體|醫|痛|傷|產|懷孕/.test(q)) return "健康";
  if (/訴|官司|告|律師|糾紛|打官司|訴訟/.test(q)) return "诉讼";
  if (/去|行|旅|搬|出國|移民|出差|出行|飛機|火車/.test(q)) return "出行";
  return "一般";
}

function lineLabel(v: YaoValue): string {
  return { 6: "老阴 ×", 7: "少阳 —", 8: "少阴 - -", 9: "老阳 ○" }[v];
}

export function buildLiuyao(
  values: YaoValue[],
  question: string,
  questionType?: string,
): LiuyaoOutcome {
  const q = (question || "").trim();
  const refuse = checkLiuyaoRefuse(q);
  if (refuse) {
    return { refused: true, reason: refuse, question: q };
  }

  let theme = (questionType || "").trim();
  if (!theme || theme === "（自動／一般）" || theme === "自动" || theme === "自動") {
    theme = inferThemeFromQuestion(q);
  }

  const lines: HexagramLine[] = values.map((v) => ({
    value: v,
    changing: v === 6 || v === 9,
    yang: v === 7 || v === 9,
    label: lineLabel(v),
  }));
  const benBinary = binaryFromLines(lines);
  const benName = hexName(benBinary);
  let zhiBinary: string | undefined;
  let zhiName: string | undefined;
  if (lines.some((l) => l.changing)) {
    const zhiLines = lines.map((l) => ({
      yang: l.changing ? !l.yang : l.yang,
    }));
    zhiBinary = binaryFromLines(zhiLines);
    zhiName = hexName(zhiBinary);
  }
  const yongShen = YONG_SHEN[theme] || YONG_SHEN["一般"];
  const changeCount = lines.filter((l) => l.changing).length;
  const programNotes = [
    "1. 看用神：先定何事何用神，用神不上卦／空亡需另论。",
    "2. 看世应：世为自己，应为对方／事体。",
    "3. 看动静：动爻生克冲合用神最紧。",
    "4. 看月日：日辰为六爻之主，月建为提纲。",
    "5. 看变卦：变生为吉变、变克为凶变（仍须整体）。",
  ];
  let verdict = "";
  if (changeCount === 0) {
    verdict = `本卦${benName}无动爻，宜看静卦用神旺衰；事体偏向「现状延续」，宜守中观变。`;
  } else if (changeCount === 1) {
    verdict = `本卦${benName}一爻动${zhiName ? `→ 变${zhiName}` : ""}；单爻发动最易论成败，重点看该动爻对用神生克。`;
  } else if (changeCount >= 4) {
    verdict = `动爻偏多（${changeCount}），事体纷杂；宜以变卦${zhiName || "—"}为主叙事，谨慎决策。`;
  } else {
    verdict = `本卦${benName}，动${changeCount}爻${zhiName ? `变${zhiName}` : ""}；按五大纲领顺序检查用神、世应、月日再下判。`;
  }
  verdict = `【所問】${q}\n【短判】${verdict} 用神取「${theme}」線：${yongShen}。一事一卦，唔好把呢卦硬扯去無關題。`;

  return {
    lines,
    benName,
    benBinary,
    zhiName,
    zhiBinary,
    question: q,
    questionType: theme,
    yongShen,
    verdict,
    programNotes,
    disclaimer:
      "本模組參考「愚人」公開線常見之六爻教學結構（一事一問、用神、世应、五大纲领、占卦守則精神）作核對演示，並非其課程原文或商業授權內容。卦象隨機／時間起卦僅供顧問流程驗證；文化參考，唔作必準保證。涉犯罪／傷害／妄顧道義求財會拒占。",
  };
}
