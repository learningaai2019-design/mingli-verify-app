/**
 * 姓名學：康熙筆畫五格三才（熊崎系華語主流）
 * Stroke table is curated open data; unknown chars use disclosed fallback.
 */
import strokes from "./kangxi-strokes.json";

export interface WugeResult {
  name: string;
  chars: { char: string; strokes: number; source: "table" | "fallback" }[];
  tian: number;
  ren: number;
  di: number;
  wai: number;
  zong: number;
  sancai: string;
  sancaiHint: string;
  geHints: { key: string; value: number; hint: string }[];
  disclaimer: string;
}

const TABLE = strokes as Record<string, number>;

/** Very rough CJK stroke fallback — disclosed as approximate, not Kangxi-official. */
function fallbackStrokes(ch: string): number {
  const code = ch.codePointAt(0) || 0;
  if (code < 0x4e00 || code > 0x9fff) return 1;
  // heuristic: common range density — not accurate; only for demo continuity
  return 8 + (code % 12);
}

function strokeOf(ch: string): { strokes: number; source: "table" | "fallback" } {
  if (TABLE[ch] !== undefined) return { strokes: TABLE[ch], source: "table" };
  return { strokes: fallbackStrokes(ch), source: "fallback" };
}

function wuxingOfNum(n: number): string {
  const m = ((n - 1) % 10) + 1;
  if (m === 1 || m === 2) return "木";
  if (m === 3 || m === 4) return "火";
  if (m === 5 || m === 6) return "土";
  if (m === 7 || m === 8) return "金";
  return "水";
}

const SANCAI_HINT: Record<string, string> = {
  木木木: "性格一貫、成長主題強，宜防固執。",
  木木火: "木生火，表現與創造欲旺。",
  木火土: "通關順暢，事業易見成果。",
  火土金: "火生土生金，由熱轉實。",
  土金水: "土生金生水，資源可流動。",
  金水木: "金生水生木，思路靈活。",
  水木火: "水生木生火，學習表現佳。",
  木土水: "木剋土、土剋水，需調和人際。",
  火金木: "相剋較多，宜以印比通關。",
  土水火: "關係張力，重在溝通節奏。",
};

function sancaiHint(sc: string): string {
  return SANCAI_HINT[sc] || `三才${sc}：以生剋通關看整體氣勢，此為熊崎系華語主流常見模板。`;
}

function geHint(label: string, n: number): string {
  const lucky = [1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 18, 21, 23, 24, 25, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81];
  const ok = lucky.includes(((n - 1) % 81) + 1) || lucky.includes(n);
  return ok
    ? `${label}${n}數：傳統上多視為吉數傾向（仍須五格同參）。`
    : `${label}${n}數：傳統上偏向需努力／波折之數，宜以人格與環境補足。`;
}

export function analyzeName(raw: string): WugeResult {
  const name = raw.replace(/\s+/g, "");
  if (!name) throw new Error("請輸入姓名");
  const chars = Array.from(name).map((char) => {
    const s = strokeOf(char);
    return { char, strokes: s.strokes, source: s.source };
  });
  // 熊崎：單姓複名／複姓處理簡化——首字為姓（若二字名則姓1名1；三字常見姓1名2；四字姓2名2）
  let surnameStroke = chars[0].strokes;
  let given: number[] = [];
  if (chars.length === 2) {
    given = [chars[1].strokes];
  } else if (chars.length === 3) {
    given = [chars[1].strokes, chars[2].strokes];
  } else if (chars.length >= 4) {
    surnameStroke = chars[0].strokes + chars[1].strokes;
    given = chars.slice(2).map((c) => c.strokes);
  } else {
    given = [1];
  }
  const givenSum = given.reduce((a, b) => a + b, 0);
  const tian = surnameStroke + 1; // 天格：姓笔画+1（单姓）
  const ren = surnameStroke + (given[0] || 0); // 人格
  const di = given.length === 1 ? given[0] + 1 : givenSum; // 地格
  const zong = surnameStroke + givenSum; // 总格（不计+1）
  const wai = zong - ren + 1; // 外格常见公式简化
  const tianWx = wuxingOfNum(tian);
  const renWx = wuxingOfNum(ren);
  const diWx = wuxingOfNum(di);
  const sancai = `${tianWx}${renWx}${diWx}`;

  return {
    name,
    chars,
    tian,
    ren,
    di,
    wai,
    zong,
    sancai,
    sancaiHint: sancaiHint(sancai),
    geHints: [
      { key: "天格", value: tian, hint: geHint("天格", tian) },
      { key: "人格", value: ren, hint: geHint("人格", ren) },
      { key: "地格", value: di, hint: geHint("地格", di) },
      { key: "外格", value: wai, hint: geHint("外格", wai) },
      { key: "總格", value: zong, hint: geHint("總格", zong) },
    ],
    disclaimer:
      "五格三才採熊崎系華語主流算法；康熙筆畫表為整理之公開常用字集。缺字會用「估算筆畫」並標示 fallback，請人工覆核辭典。姓名學為文化參考，唔等於命運判決。",
  };
}
