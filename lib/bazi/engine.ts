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


/* ========== 口語顧問風解讀（按盤面因素組句，避免填空 boilerplate） ========== */

interface ChartProfile {
  dm: string;
  el: string;
  female: boolean;
  monthStemRel: string;
  hourStemRel: string;
  dayBranchRel: string;
  yearStemRel: string;
  hasWealth: boolean;
  hasOfficer: boolean;
  hasKill: boolean;
  hasPrint: boolean;
  hasFood: boolean;
  hasShang: boolean;
  hasBiJie: boolean;
  outputHeavy: boolean;
  pressureHeavy: boolean;
  pillars: string;
}

function profileOf(chart: BaziChart): ChartProfile {
  const vals = Object.values(chart.shishen);
  // 亦掃四柱藏干，避免只睇主氣漏咗印／官
  const hiddenRels: string[] = [];
  for (const pillar of [chart.year, chart.month, chart.day, chart.hour]) {
    for (const hs of pillar.hiddenStems || []) {
      hiddenRels.push(shishenOf(chart.dayMaster, hs));
    }
  }
  const join = [...vals, ...hiddenRels].join("、");
  const monthStemRel = chart.shishen["月干"] || "—";
  const hourStemRel = chart.shishen["時干"] || "—";
  const dayBranchRel = chart.shishen["日支主氣"] || "—";
  const yearStemRel = chart.shishen["年干"] || "—";
  const hasShang = join.includes("傷官");
  const hasFood = join.includes("食神");
  const hasKill = join.includes("七殺");
  const hasOfficer = join.includes("正官") || hasKill;
  return {
    dm: chart.dayMaster,
    el: chart.dayMasterElement,
    female: chart.gender === "坤造",
    monthStemRel,
    hourStemRel,
    dayBranchRel,
    yearStemRel,
    hasWealth: join.includes("財"),
    hasOfficer,
    hasKill,
    hasPrint: join.includes("印"),
    hasFood,
    hasShang,
    hasBiJie: join.includes("比") || join.includes("劫"),
    outputHeavy: hasShang || hasFood,
    pressureHeavy: hasKill || join.includes("正官"),
    pillars: `${chart.year.stem}${chart.year.branch} ${chart.month.stem}${chart.month.branch} ${chart.day.stem}${chart.day.branch} ${chart.hour.stem}${chart.hour.branch}`,
  };
}

function dmPersonSketch(p: ChartProfile): string {
  const soft = "乙己辛丁癸".includes(p.dm);
  const wood = p.el === "木";
  const fire = p.el === "火";
  const earth = p.el === "土";
  const metal = p.el === "金";
  const water = p.el === "水";
  if (wood && soft) {
    return "你唔係硬碰硬嗰種木，多半會彎、會繞、會記低人家情緒，但底線其實好清。外面可以睇落柔、識做人；入面清楚自己要咩，亦唔輕易把話事權交晒畀人。";
  }
  if (wood) return "你帶住一股要伸展、要長出自己位置嘅勁；直、有主張，亦容易同僵化規矩頂住。";
  if (fire && soft) return "你內裡熱、外放時有光，但亦易過勞；人一見到你就知你有感覺、有觀點。";
  if (fire) return "你動力外露，想被看見、想把事推前；節奏快，亦要學收剎。";
  if (earth && soft) return "你重信、重安穩，做事願意承載；有時會忍得耐，但一經決定就好難返轉頭。";
  if (earth) return "你穩、承得住事，亦容易變成身邊人嘅依靠；記得自己都要留位置休息。";
  if (metal && soft) return "你重分寸同質素，嘴可以溫柔，標準唔會假；看不過眼嘅嘢，內心已打咗分。";
  if (metal) return "你果斷、講規則，做事要有收口；最怕含糊同無標準。";
  if (water && soft) return "你靈活、善體人意，思緒多；有時想太多先行動，有時又忽然轉向。";
  return "你善變通、識看勢，大腦轉得快；穩定感要靠自己刻意練。";
}

function dominantPatternSketch(p: ChartProfile): string {
  const bits: string[] = [];
  if (p.hasShang && p.hasOfficer) {
    bits.push("盤面有「有想法」同「有責任／壓力」兩股力一齊——腦快、嘴利、標準高，同時又常覺得自己應該扛多啲。處理得好，批判力同執行力會變成專長；處理得差就口舌、內耗、對權威又反又黏。");
  } else if (p.hasShang) {
    bits.push("你睇穿問題嘅速度快過一般人，對廢話同「一向都係咁」好冇耐性；長處係創新、改方案、教學顧問，短處係得罪人同自我苛責。");
  } else if (p.hasFood) {
    bits.push("你有表達同分享欲，適合把技能變成作品或服務；記得收費同休息都要有程序，唔好淨係付出。");
  }
  if (p.hasOfficer && !p.hasShang) {
    if (p.hasKill) bits.push("壓力同期限反而令你醒神；平順時易悶。宜把競爭感導向可交付嘅目標。");
    else bits.push("你在乎名份同做得啱；規矩可以係助力，但唔好變成自我捆綁。");
  }
  if (p.hasPrint) {
    bits.push("你其實需要安全感同「我做得啱、我企得穩」嘅感覺——學習、證照、導師、睡眠，往往係你安頓鋒芒嘅水。");
  }
  if (p.hasWealth) {
    bits.push("對機會同資源敏感，錢同「被需要／被聽到」有時會綁埋；有專業做底，機會先留得住。");
  }
  if (!bits.length) {
    bits.push("整體節奏偏中性，成敗多在自身規劃同執行；貴人穩重守信，遇事先觀察再交心。");
  }
  return bits.join("");
}

function tipForRel(rel: string): { mood: string; tip: string; noble: boolean; petty: boolean; verb: string } {
  const noble = ["正官", "正印", "正財", "食神"].includes(rel);
  const petty = ["七殺", "劫財", "傷官"].includes(rel);
  const map: Record<string, { mood: string; tip: string; verb: string }> = {
    正官: { mood: "要守信、要交代、要有個樣", tip: "宜把責任寫清楚、少越界；肯幫忙嘅人多係穩重有職銜、講規矩嗰類。", verb: "企穩同守約" },
    七殺: { mood: "有人催、有期限、有競爭", tip: "把壓力拆成可執行清單；少同情緒化、愛搞是非嘅人糾纏，重要對話留底。", verb: "化壓為行動" },
    正印: { mood: "想充實、想被人托住", tip: "宜進修、求助長輩或導師；貴人特徵係溫厚、肯分享方法，唔係淨客氣。", verb: "學習同求助" },
    偏印: { mood: "思緒密、靈感多亦易孤", tip: "揀一條線深耕，忌同時開太多坑；留意把你拉入封閉圈嘅人。", verb: "專精一條線" },
    正財: { mood: "想理順錢同收成", tip: "記帳、穩收；合作揀務實肯對賬嘅人。大額決定留一夜。", verb: "穩健收成" },
    偏財: { mood: "機會同花費一齊晃", tip: "橫財／兼職可以接，但預算要封頂；聽到「穩賺」「保證」就停一停。", verb: "把握機會兼控預算" },
    食神: { mood: "想講、想做、想交到人前", tip: "把作品同技能換成清楚報價；欣賞你、肯畀舞台嘅人值得深交。", verb: "輸出同交貨" },
    傷官: { mood: "想改、想講真話、易頂到人", tip: "用專業表述代替情緒反彈；愛挑刺、散播是非嗰類，少奉陪。表達有收口，反而似高手。", verb: "突破兼收口" },
    比肩: { mood: "自主、同儕並肩亦並肩爭", tip: "分工同分成寫明；提防搶功或借錢唔還。", verb: "分工清楚" },
    劫財: { mood: "資源易被分薄或拉扯", tip: "錢銀往來白紙黑字；表面義氣背後計較嘅人，保持禮貌距離。", verb: "守界同分明" },
  };
  const hit = map[rel] || { mood: "節奏唔算偏鋒", tip: "重在自身規劃；貴人穩重守信，小人情緒化——遇人先觀察再交心。", verb: "按自己節奏行" };
  return { ...hit, noble, petty };
}

function monthTone(dmEl: string, branchChar: string): "生扶" | "受剋" | "耗洩" | "平穩" {
  const be = BRANCH_ELEMENT[branchChar] || "土";
  if (be === dmEl || GENERATE[be] === dmEl) return "生扶";
  if (CONTROL[be] === dmEl) return "受剋";
  if (CONTROL[dmEl] === be || GENERATE[dmEl] === be) return "耗洩";
  return "平穩";
}

const DOMAIN_KEYS = [
  ["性格", "性格"], ["學業", "學業"], ["事業", "事業"], ["財帛", "財帛"],
  ["田宅", "田宅"], ["父母", "父母"], ["兄弟", "兄弟"], ["朋輩", "朋輩"],
  ["夫妻", "夫妻"], ["子女", "子女"], ["健康", "健康"], ["早年到晚年", "早年到晚年"],
] as const;

function natalText(key: string, chart: BaziChart, p: ChartProfile): string {
  switch (key) {
    case "性格":
      return `${dmPersonSketch(p)}${dominantPatternSketch(p)}月令${chart.month.branch}拉住你日常節奏（月干對你係「${p.monthStemRel}」）；日支${chart.day.branch}則係屋企同親密關係嘅底色。實用一句：重要決定畀自己冷靜半日再答，標準可以高，語氣留溫。`;
    case "學業":
      if (p.hasShang || p.hasFood) {
        return "你學嘢多數靠理解同實作，多過死背。批判式吸收強——宜揀容得你問「點解」嘅老師或課程；考試年就刻意補系統筆記同請教過來人。興趣導向專案反而易出成績；牌照、長線證書對你係「補水」，唔係裝飾。";
      }
      if (p.hasPrint) {
        return "印星有根，文思同系統學習較順。宜訂可完成嘅進修路徑（三個月一期），定時溫習好過臨急抱佛腳；有導師或同伴問責會穩好多。";
      }
      return "學業線整體平穩，宜按興趣深耕一技。與其樣樣識少少，不如一門練到可幫人、可報價。";
    case "事業":
      if (p.hasShang && p.hasOfficer) {
        return "你適合「因為識先有位」——顧問、分析、改系統、教學、內容、品質把關、亂局入面定標準，都似你。有期限同權責嘅崗位反而令你醒神；最耗嘅係長期無話語權、只准執行唔准改。每年留一次：作品集／客戶／牌照有冇累積，唔好淨係轉場逃避悶。";
      }
      if (p.hasOfficer) {
        return "你扛得住架構同責任，升遷靠交付同口碑，唔好淨靠關係。揀「責任清晰」多過「好聽 title」；每月同客戶或協作方對齊一次預期，少誤會。";
      }
      if (p.outputHeavy) {
        return "你靠輸出換位置：作品、案例、公開可見嘅成果。報價清晰、收款節點寫明；檔期爆嘅時候要敢講不，專業感反而升。";
      }
      return "事業宜穩中求進，忌頻繁跳槽而無累積。每份工至少榨乾可帶走嘅技能同人脈，再考慮下一步。";
    case "財帛":
      if (p.hasWealth && p.outputHeavy) {
        return "錢對你嚟講，好多時同「我有冇被需要、我交出嚟嘅嘢有冇價」綁埋。有機會亦有花費——收入可分生活、備用、增值三格；大額投資留冷靜期，唔追「必賺」故事。有專業護城，偏財機會先留得住。";
      }
      if (p.hasWealth) {
        return "理財意識唔差，仍要防被人分薄。合作先對賬；借貸要有還款日程。穩收同信譽，長遠大過單次風光。";
      }
      return "財星唔顯眼時，宜以技能換財，勿投機。先建可重複嘅現金流（服務、訂閱、分潤），再諗資產配置。";
    case "田宅":
      return `日支${chart.day.branch}（${chart.day.nayin}）係你「屋企感覺」嘅底色——你要瞓得著、行得順、有規矩嘅地方，多過純排場。遷居或裝修以生活功能為先；合約同物業文件自己覆核一遍，少交白卷畀人代簽。`;
    case "父母":
      return p.hasPrint
        ? `年柱${chart.year.stem}${chart.year.branch}連住祖上父母意象；印星有力時，長輩提攜同求助渠道較順——有事可坦誠開口，同時記得回報心意，關係先唔會變成單向索取。`
        : `年柱${chart.year.stem}${chart.year.branch}看父母緣。印星唔顯眼時，宜自力更生，同時維持定期問候——關係靠溝通，唔係靠對方猜你需要咩。`;
    case "兄弟":
      return p.hasBiJie
        ? "手足或近親之間，有緣亦容易有競爭或分帳議題。共同財產、照顧責任開家庭會議寫低；少喺第三人面前數對方不是。節日一句問候，大事先商量。"
        : "手足緣唔強逼，獨立性高——聯絡要自己主動。涉及擔保或聯名，三思；平日約食飯維繫就夠。";
    case "朋輩":
      return "朋友圈宜擇能互相成就、講信用嘅人；酒肉應酬過多易耗身耗財。真正貴人未必最熱鬧嗰個，而係出事肯現身、肯對文件嗰個。新識三個月內唔好大額借貸或擔保。";
    case "夫妻":
      return spouseText(p, chart);
    case "子女":
      if (p.outputHeavy || p.pressureHeavy) {
        return "子女或你「交出去嘅生命」（學生、下屬、作品）標準會高，你肯砸資源，亦期望對方可獨當一面。教養宜規矩清、情緒接；自己壓力唔好原封轉嫁。有系統嘅耐心，往往比純嚴更有效。";
      }
      return "子女線平穩，重陪伴質量。固定一齊食飯、散步呢類「無人機時間」，往往比昂貴禮物更有用；父母口徑要一致。";
    case "健康":
      return `日主${p.el}，養生講平衡，唔講迷信。作息、飲水、適量運動係底線；情緒同睡眠優先——好多警號由呢度嚟。長期唔舒服要請醫生，呢段文字唔構成醫療建議。你若天生易催自己，就把「留空白日」當專業紀律，而唔係懶。`;
    case "早年到晚年":
      return `早年看年柱${chart.year.stem}${chart.year.branch}，青年看月柱${chart.month.stem}${chart.month.branch}，中年看日支${chart.day.branch}，晚年看時柱${chart.hour.stem}${chart.hour.branch}。人生唔係一條直線——每一段有唔同主旋律。你呢類盤，高光多來自被看見嘅輸出同亂局入面定標準；低潮多來自標準高到自我折磨。關鍵係肯調整節奏。以上係文化參考，唔係必準斷語。`;
    default:
      return "—";
  }
}

function spouseText(p: ChartProfile, chart: BaziChart): string {
  if (p.female) {
    if (p.hasKill || p.hasOfficer) {
      return `伴侶主題對你唔模糊——你要穩、有能力、肯講清楚責任同名份嘅人，多過飄忽浪漫。日支${chart.day.branch}提醒：屋企同親密關係要有規矩同物質基礎，太散難耐。相處上分清「責任」同「控制」；辯論贏咗關係未必贏。定期坦白傾期望，大事共同決策，少冷戰、少靠對方猜。`;
    }
    return `感情要經營：固定相處時間、共同處理家務同財務清單。日支${chart.day.branch}係親密底色——有事宜講明，少腦補。今年修關係往往大過急於挑新對象。`;
  }
  if (p.hasWealth) {
    return `伴侶／姻緣同資源主題有連動。錢同愛分開傾；承諾做到先再許下一個。已有伴可一齊規劃財務目標，減少誤會。日支${chart.day.branch}提醒日常穩定感好重要。`;
  }
  return `姻緣平穩，重日常溫柔多過儀式感。有矛盾當日清，唔好積到爆。日支${chart.day.branch}係相處底色，期望要講出口。`;
}

export function baziTemplateReading(chart: BaziChart, liunianYear?: number): TemplateReading {
  const p = profileOf(chart);
  const sections: DomainSection[] = DOMAIN_KEYS.map(([key, title]) => ({
    key,
    title,
    text: natalText(key, chart, p),
  }));
  if (liunianYear) sections.push(...liunianSections(chart, p, liunianYear));
  sections.push(oralSynthesis(chart, p, liunianYear));
  return {
    label: "規則／顧問口語解讀・文化參考",
    disclaimer: "唔係必然準確之斷語；僅供顧問核對排盤與敘事結構。禁止作為醫療、投資、法律依據。文化參考，唔作必準保證。",
    sections,
  };
}

function liunianYearVoice(rel: string, year: number, ygz: string, p: ChartProfile): string {
  const { mood, tip, noble, petty, verb } = tipForRel(rel);
  const open =
    rel === "傷官"
      ? `${year}年（${ygz}）對你嚟講，比較似外面催你「改、講、交到亮處」——${mood}。唔使解讀成災難；鋒芒被放大嗰年，成敗睇你識唔識收口。`
      : rel === "食神"
        ? `${year}年（${ygz}）有人遞咪畀你嘅味道——想講、想做、想交到人前。檔期易滿，承諾要封頂。`
        : rel === "七殺"
          ? `${year}年（${ygz}）期限同競爭感較近身——${mood}。壓力可以係燃料，亦可以係內耗，分別在有冇清單。`
          : `呢年流年干對你係「${rel}」——感覺上${mood}。重點唔係標籤，而係你點樣${verb}。`;
  const mid = tip;
  const people = noble
    ? "今年較易遇上肯默默幫手、講信用嘅人——記得主動約、主動問清楚。小人特徵仍係：情緒化操弄、散播是非、表面熱絡背後計較。"
    : petty
      ? "口舌、爭奪、挑剔嘅戲份可能多啲——重要對話留紀錄，少傳話、少即時回擊。貴人反而係穩重守信、肯對文件、出事現身嗰類。"
      : "貴人穩重守信；小人情緒化愛搞是非。遇人事，先觀察再交心。";
  const close = p.outputHeavy
    ? "全年宜：輸出有價（有單、有收錢程序）、計劃寫低、身體唔好硬撐。"
    : "全年宜：計劃寫低、錢銀分開帳戶、睡眠同界線當紀律。";
  return `${open}${mid}${people}${close}`;
}

function liunianDomain(rel: string, key: string, year: number, branch: string, branchEl: string, p: ChartProfile, chart: BaziChart): string {
  const { petty, noble } = tipForRel(rel);
  switch (key) {
    case "流年性格":
      if (rel === "傷官") return `${year}年心態易「睇穿就想講」——標準升高，對廢話更冇耐性。宜接受自己今年情緒上臉快，唔好同往年硬比。每週留一段淨係自己嘅時間，整理感受再出門應對人；鋒利可以留，語氣要留溫。`;
      if (rel === "食神") return `今年表達欲同分享欲較旺，人會覺得你有光、亦易攰。接受自己需要舞台，同時接受自己需要空白；兩者都係專業。`;
      if (rel === "七殺") return `壓力感近身時，你反而可能更醒神——但身邊人未必跟得上你嘅催促。把「我急」翻譯成具體步驟同期限，少用情緒推人。`;
      return `${year}年心態主調同「${rel}」有關。宜觀察自己情緒主題，唔好硬撐成性格。每週留復盤時間，流年先唔會白過。`;
    case "流年學業":
      if (["正印", "偏印"].includes(rel)) return "今年利系統學習、考证、更新資格。訂一個三個月可完成嘅目標，多過空喊志向；有同伴問責更穩。";
      if (["食神", "傷官"].includes(rel)) return "較適合「教中學、做中學」——分享、帶後輩、整理自己嘅方法論。純閉關苦讀未必係主旋律，除非你刻意留檔期。";
      return "學業唔一定係主旋律，但仍可偷師：跟專案邊做邊學。考試或交功課月份預留緩衝，忌臨時抱佛腳。";
    case "流年事業":
      if (rel === "傷官" || rel === "食神") {
        return `適合公開輸出：簡報、課程、內容、談判、重要會議——你改方案嘅腦，容易變成「被請發表意見」。亦容易檔期爆、承諾過多。練習：講完就收，交付就停，唔好無限打磨到錯過時機。${p.hasKill ? "有權責、有標準嘅場合反而啱你發揮。" : ""}`;
      }
      if (["正官", "七殺"].includes(rel)) {
        return "有架構嘅崗位或要你拍板嘅場合較入戲。升遷／轉工宜揀責任清晰；每月一次對齊預期，少靠感覺。忌喺無意義人際鬥爭耗乾。";
      }
      return "事業宜穩守基本盤，少衝動跳槽。把現有工種做到可量化成績，年底先盤點下一步。";
    case "流年財運":
      if (["正財", "偏財"].includes(rel)) {
        return "進帳機會同決策一齊嚟；可以係收成期，前提係有價、有單、有冷靜。大額先冷處理一晚；家用同投資分開。";
      }
      if (rel === "食神") {
        return "進帳往往同表現力、口碑、被邀請有關。風光同進帳可以一齊，但分賬同收費程序要有——唔好只顧靚。";
      }
      if (rel === "傷官" || petty) {
        return "錢同面子、口碑容易同時晃；亦可能有爭奪或分薄感。合作先寫合約，借貸要日程；今年守界線同信譽，大過追單次風光。印運或學習底子若仲喺，長期信譽仍係你嘅水。";
      }
      return "財運平穩，靠技能同勤力換現金。少參與來路不明嘅群組投資。";
    case "流年田宅":
      return `流年支${branch}（${branchEl}）同居住、搬遷話題有關。若裝修或睇樓，盯合約同隱藏開支；家居以瞓得好、行得順為先。日支${chart.day.branch}本就喜穩——大搬動宜問自己係解問題定逃避。`;
    case "流年父母":
      if (["正印", "偏印", "正官"].includes(rel)) {
        return "同長輩互動機會較多，可求教亦可盡孝。健康話題主動問、陪診更好；錢銀資助要量力並講清楚，避免面子單向。";
      }
      return "父母線要自己維繫：定期問候、節日露面。有分歧宜当面講，少用訊息冷戰。";
    case "流年兄弟":
      if (["比肩", "劫財"].includes(rel)) {
        return "手足／近親之間合作同競爭都可能浮現。共同財產、照顧責任開會議寫低；少喺外人面前數不是。";
      }
      return "手足緣平常，主動約食飯即可。涉及擔保或聯名，三思。";
    case "流年朋輩":
      if (petty) {
        return "朋友圈要篩：少出沒是非局，聚會唔好傳話。真正貴人係出事肯現身、肯對細節嗰個，唔係最熱鬧嗰個。";
      }
      if (noble || ["食神", "正財"].includes(rel)) {
        return "朋輩可互相成就，適合組局學習或小合作。新相識三個月內唔好大額金錢往來；欣賞你才華嘅人，值得深交。";
      }
      return "朋輩平穩。酒肉應酬適可而止；把時間留給能互相托住嘅人。";
    case "流年夫妻":
      if (p.female) {
        if (["正官", "七殺"].includes(rel)) {
          return "伴侶／姻緣戲份較明顯。已有伴宜多坦白少猜疑；主張強嘅年份，重點唔係誰啱，而係有冇留面子同留休息。未有伴可擴社交但唔好急承諾。";
        }
        if (["食神", "傷官"].includes(rel)) {
          return "場合多、話題多，關係要么更熱鬧，要么你太忙而忽略伴侶。火氣上臉快時，一句重話可以傷過夜——主動約「無目的相處」，唔係開會式傾偈。";
        }
        return "感情線要經營：固定約會、共同清單。宜修關係多過急於挑新對象。";
      }
      if (["正財", "偏財"].includes(rel)) {
        return "伴侶主題較活。錢同愛分開傾；已有伴可一齊規劃財務目標。承諾要做到。";
      }
      return "姻緣平穩，重日常溫柔。有矛盾當日清，唔好積到爆。";
    case "流年子女":
      if (["食神", "傷官", "正官", "七殺"].includes(rel)) {
        return "親子、帶人、作品——邊樣係你交出去嘅，邊樣就佔情緒。你可以好催、好用力改；記得講明期望之外要畀具體支援，自己亦需要被照顧。";
      }
      return "子女線平穩。固定親子時光足夠；學業督促口徑一致，父母唔好一個鬆一個緊。";
    case "流年健康":
      return `日主${p.el}喺${year}年受${branch}氣影響。${petty || ["傷官", "食神", "七殺"].includes(rel) ? "輸出同壓力年份，睡眠、肩頸、情緒上臉要優先處理——攰唔係弱，係訊號。" : "整體可維持，仍忌爆肝式加班。"}實用：飲水、走動、定期檢查；唔舒服睇醫生，呢度唔係醫療指引。`;
    default:
      return "—";
  }
}

/** 逐月：按地支＋流年十神＋月份序組出唔同注意點，避免只換關鍵字 */
function monthBody(
  label: string,
  branch: string,
  idx: number,
  el: string,
  rel: string,
  year: number,
): string {
  const be = BRANCH_ELEMENT[branch] || "土";
  const tone = monthTone(el, branch);
  const { petty, noble } = tipForRel(rel);

  const openings: Record<string, string> = {
    生扶: `${label}（${branch}）對你日主較有生扶感，氣勢上適合把一件重要事推前——面試、提案、公開場合、簽約前準備。`,
    受剋: `${label}（${branch}）壓力或阻滯感可能上嚟，宜守盤多過開新戰場。催你即時拍板嘅人，一律要求書面同冷靜期。`,
    耗洩: `${label}（${branch}）出力換成果嘅月份——忙、有交貨，亦易過勞。適合清任務同收費，唔適合同時開太多新局。`,
    平穩: `${label}（${branch}）節奏偏平，適合整理、複盤、維繫關係同補瞓。貴人未必高調，可能係默默幫你對文件嗰個。`,
  };

  // 每月獨特 watch-points（12 條輪轉＋按 tone 微調）
  const watches = [
    `留意檔期有冇承諾過多；本月只攻一件「對外可見」嘅大事就夠。`,
    `錢銀往來寫低；有人叫你墊錢或聯署，先問還款同責任誰屬。`,
    `健康上盯睡眠同腸胃；連續催谷三日就要插入空白半日。`,
    `同長輩或導師請教一個具體問題，問清楚再行動，少靠自己硬撐。`,
    `輸出可以靚，但要有收錢／收口程序；唔好只做免費示範做到尾。`,
    `伴侶或家人若覺得你催，改用清單溝通，少用語氣推人。`,
    `朋友聚會少傳話；是非局提早離場，保住氣同名声。`,
    `合約、報價、工時三樣寫清；表面義氣叫你「遲啲先算」嘅，唔好信。`,
    `適合家居小修或健康檢查，積小步驟；大額裝修可比價多一輪。`,
    `若有公開場合，講完就收——唔好會後仲用訊息無限補充到自己耗乾。`,
    `手足或同事分工再對一次；搶功苗頭出現就拉返白紙黑字。`,
    `月尾花十五分鐘寫：做成咩、下次改咩；${year}年先唔會散咗。`,
  ];

  let people = "";
  if (tone === "受剋" || (petty && idx % 2 === 1)) {
    people = "小人特徵呢個月要醒：愛挑刺、散播焦慮、催你即決——保持禮貌距離。";
  } else if (tone === "生扶" || (noble && idx % 2 === 0)) {
    people = "貴人特徵：肯引薦、講信用、唔搶功——有機會主動約短聚，唔好等佢哋猜。";
  } else if (tone === "耗洩") {
    people = "提防「叫你墊力又唔對價」嘅人；你嘅時間要標價。";
  } else {
    people = "遇人先觀察再交心；穩重守信嘅，值得加深。";
  }

  // 流年十神加一句具體、唔重複 boilerplate
  let yearBit = "";
  if (rel === "傷官") {
    const shangBits = [
      "配合今年想講真話嘅衝動：公開表達前，刪一次情緒句，留專業句。",
      "今年口舌戲份本就多啲——呢個月特別少傳話、少聯署含糊文件。",
      "有人頂你時，回覆可隔夜；當日火氣回覆，事後多半要收場。",
      "改方案可以，但本月要揀一個版本交出去，唔好改到無截止。",
      "被挑刺時先問「邊點可改」，再決定反唔反駁——省氣。",
      "適合把挑剔變成檢查清單，幫人／幫自己收口，多過純批評。",
    ];
    yearBit = shangBits[idx % shangBits.length];
  } else if (rel === "食神") {
    yearBit = "輸出年：本月交一件「可見成品」比開三個新題有用。";
  } else if (rel === "七殺") {
    yearBit = "壓力近身時，把截止日期寫牆上，逐項剔走，少喺腦內空轉。";
  } else if (rel === "正印" || rel === "偏印") {
    yearBit = "學習／求助窗口：問一個具體問題，帶走一個可執行答案。";
  } else if (rel === "正財" || rel === "偏財") {
    yearBit = "涉及大額，冷處理一晚；風光同進帳可以一齊，冷靜唔可少。";
  } else {
    yearBit = watches[idx];
  }

  let watch = watches[idx % 12];
  if (yearBit.includes(watch.slice(0, 8))) watch = watches[(idx + 5) % 12];
  return `${openings[tone]}${watch}${people}${yearBit}`;
}

function liunianSections(chart: BaziChart, p: ChartProfile, year: number): DomainSection[] {
  const solar = Solar.fromYmd(year, 6, 1);
  const ygz = solar.getLunar().getEightChar().getYear();
  const stem = ygz[0];
  const branch = ygz[1];
  const rel = shishenOf(chart.dayMaster, stem);
  const branchEl = BRANCH_ELEMENT[branch] || "土";
  const out: DomainSection[] = [];

  out.push({
    key: "流年總論",
    title: `流年 ${year}（${ygz}）總論`,
    text: liunianYearVoice(rel, year, ygz, p),
  });

  const domainSpecs: { key: string; title: string }[] = [
    { key: "流年性格", title: "流年・性格／狀態" },
    { key: "流年學業", title: "流年・學業" },
    { key: "流年事業", title: "流年・事業" },
    { key: "流年財運", title: "流年・財運" },
    { key: "流年田宅", title: "流年・田宅／家居" },
    { key: "流年父母", title: "流年・父母" },
    { key: "流年兄弟", title: "流年・兄弟／手足" },
    { key: "流年朋輩", title: "流年・朋輩" },
    { key: "流年夫妻", title: "流年・婚姻／配偶" },
    { key: "流年子女", title: "流年・子女" },
    { key: "流年健康", title: "流年・健康" },
  ];
  for (const d of domainSpecs) {
    out.push({
      key: d.key,
      title: d.title,
      text: liunianDomain(rel, d.key, year, branch, branchEl, p, chart),
    });
  }

  const months: { label: string; branch: string }[] = [
    { label: "正月", branch: "寅" }, { label: "二月", branch: "卯" }, { label: "三月", branch: "辰" },
    { label: "四月", branch: "巳" }, { label: "五月", branch: "午" }, { label: "六月", branch: "未" },
    { label: "七月", branch: "申" }, { label: "八月", branch: "酉" }, { label: "九月", branch: "戌" },
    { label: "十月", branch: "亥" }, { label: "冬月", branch: "子" }, { label: "臘月", branch: "丑" },
  ];
  months.forEach((m, idx) => {
    out.push({
      key: `流月${idx + 1}`,
      title: `流年批注・${m.label}${m.branch}`,
      text: monthBody(m.label, m.branch, idx, p.el, rel, year),
    });
  });
  return out;
}

function oralSynthesis(chart: BaziChart, p: ChartProfile, liunianYear?: number): DomainSection {
  const paras: string[] = [];
  paras.push(
    `若果唔逐個術語嚟拆，淨係望住成個盤——我會咁同你講一個人。${dmPersonSketch(p)}${dominantPatternSketch(p)}`,
  );
  paras.push(
    `錢同工作對你唔係兩件完全分開嘅事。${p.outputHeavy ? "你適合被人因為「識」而請，多過因為「位」而假識；顧問、改系統、教、寫、把關品質，都似你。" : "你做事重累積同口碑，忌無根亂跳。"}${p.hasWealth ? "機會眼光有，但要專業做底，先唔會嚟得快走得快。" : ""}事業上${p.pressureHeavy ? "有期限反而易醒神；最怕無話語權又唔准你改。" : "穩守交付，先談名堂。"}`,
  );
  paras.push(
    `感情同屋企嗰邊，日支${chart.day.branch}好關鍵。${p.female ? "你要穩、有能力、肯講責任同名份嘅人；細膩歸細膩，你亦一眼睇穿——務實溝通比腦補重要。" : "親密關係要講清楚期望，錢同愛分開傾。"}${p.hasPrint ? "你需要安全感同「做得啱」嘅感覺，學習同睡眠係你嘅水。" : ""}`,
  );
  if (liunianYear) {
    const ygz = Solar.fromYmd(liunianYear, 6, 1).getLunar().getEightChar().getYear();
    const rel = shishenOf(chart.dayMaster, ygz[0]);
    const { verb, mood } = tipForRel(rel);
    if (rel === "傷官" || rel === "食神") {
      paras.push(
        `講到${liunianYear}年（${ygz}），比較似「交到亮處」——${mood}。有光、有聲，亦有熱。成敗關鍵係：輸出有價，熱情有剎；貴人穩重守信，口舌是非少奉陪。`,
      );
    } else {
      paras.push(
        `講到${liunianYear}年（${ygz}），重點係${verb}——${mood}。貴人穩重守信，小人情緒化；遇事先觀察再交心。`,
      );
    }
  }
  paras.push(
    `最後實用一句：命理只係文化參考地圖，唔係判決書。你今日肯做嘅小步驟——回訊息、記一筆帳、早睡一小時、把鋒芒收成可交付嘅專業——往往比任何「必準」斷語更改寫年底成績。我寧願你用人生核對、糾正，多過我扮好準。`,
  );
  return {
    key: "口語綜合",
    title: "口語綜合",
    text: paras.join("\n\n"),
  };
}
