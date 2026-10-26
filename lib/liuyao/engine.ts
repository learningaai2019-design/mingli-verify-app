/**
 * 六爻：铜钱／手动／时间起卦 + 装卦 + 用神 + 五大纲领风格短判
 * 披露：參考愚人公開線教學結構，非其商業課內容複製。
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
  questionType: string;
  yongShen: string;
  verdict: string;
  programNotes: string[];
  disclaimer: string;
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
  // bottom to top -> string of 0/1 with index0 = 初
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
    // 3 coins: yang=3 yin=2; sum 6/7/8/9
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
  财运: "妻财为用神",
  感情: "妻财（问男）／官鬼（问女）为用神；亦可看应爻",
  健康: "世爻／父母为用（视病情）",
  诉讼: "官鬼为用，兄弟为忌",
  出行: "父母为用（车船文书），应爻为对方／目的地",
  一般: "世爻为用，应爻为事体",
};

function lineLabel(v: YaoValue): string {
  return { 6: "老阴 ×", 7: "少阳 —", 8: "少阴 - -", 9: "老阳 ○" }[v];
}

export function buildLiuyao(
  values: YaoValue[],
  questionType: string,
): LiuyaoResult {
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
  const yongShen = YONG_SHEN[questionType] || YONG_SHEN["一般"];
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

  return {
    lines,
    benName,
    benBinary,
    zhiName,
    zhiBinary,
    questionType,
    yongShen,
    verdict,
    programNotes,
    disclaimer:
      "本模組參考「愚人」公開線常見之六爻教學結構（用神、世应、五大纲领）作核對演示，並非其課程原文或商業授權內容。卦象隨機／時間起卦僅供顧問流程驗證。",
  };
}
