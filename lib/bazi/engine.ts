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

function tipForRel(rel: string): { mood: string; tip: string; noble: boolean; petty: boolean } {
  const noble = ["正官", "正印", "正財", "食神"].includes(rel);
  const petty = ["七殺", "劫財", "傷官"].includes(rel);
  if (rel === "正官") return { mood: "規矩、責任感浮上嚟", tip: "宜守信守時、少越界；貴人多係穩重有職銜、肯講規矩嘅人。", noble, petty };
  if (rel === "七殺") return { mood: "壓力同衝勁一齊嚟", tip: "宜化壓為行動計劃；小人多情緒化、愛操弄是非，宜留底據、少口角。", noble, petty };
  if (rel === "正印") return { mood: "想充實、想被照顧", tip: "宜進修、求助長輩／導師；貴人特徵：溫厚、肯分享知識。", noble, petty };
  if (rel === "偏印") return { mood: "思緒多、靈感亦多", tip: "宜專注一條線，忌三心兩意；留意 isolative 人際。", noble, petty };
  if (rel === "正財") return { mood: "理財意識醒", tip: "宜穩健收成、記帳；貴人多務實肯合作。", noble, petty };
  if (rel === "偏財") return { mood: "機會同花費都多", tip: "宜把握橫財／兼職機會，但要控預算；忌聽信暴利話術。", noble, petty };
  if (rel === "食神") return { mood: "表達、創作欲強", tip: "宜輸出作品／技能換回報；貴人多欣賞你才華、肯畀舞台。", noble, petty };
  if (rel === "傷官") return { mood: "想突破、易頂撞", tip: "宜用專業說話代替情緒反彈；小人特徵：愛挑刺、散播是非。", noble, petty };
  if (rel === "比肩") return { mood: "自主、同儕競爭", tip: "宜分工清晰、合約寫明；留意搶功或借錢不還嘅人。", noble, petty };
  if (rel === "劫財") return { mood: "爭奪、分薄資源", tip: "錢銀往來要寫清楚；小人特徵：表面義氣、背後計較。", noble, petty };
  return { mood: "節奏偏中性", tip: "重在自身規劃；貴人穩重守信，小人情緒化散播是非——遇人先觀察再交心。", noble, petty };
}

function monthTone(dm: string, branchChar: string): "生扶" | "受剋" | "耗洩" | "平穩" {
  const be = BRANCH_ELEMENT[branchChar] || "土";
  if (be === dm || GENERATE[be] === dm) return "生扶";
  if (CONTROL[be] === dm) return "受剋";
  if (CONTROL[dm] === be || GENERATE[dm] === be) return "耗洩";
  return "平穩";
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
        text = `你日主係${chart.dayMaster}（${el}），氣質偏「${elementTone(el)}」。月令${chart.month.branch}做提綱，性格底色好多時由呢度定調。整體嚟講，你唔係單調一種人——有時要伸展、有時要收斂。實用建議：重要決定畀自己冷靜半日再答，少俾一時情緒牽住走。`;
        break;
      case "學業":
        text = hasPrint
          ? "印星有氣，文思同系統學習較順。宜揀穩定進修路徑（證書、長線課程），定時溫習好過臨急抱佛腳。"
          : hasOutput
            ? "食傷較顯，表達同實作學習強過死背。考試年份可刻意補「印」——請教過來人、整理筆記系統。興趣導向專案反而易出成績。"
            : "學業線整體平穩，宜按興趣深耕一技。與其樣樣識少少，不如一門練到可幫人、可賺錢。";
        break;
      case "事業":
        text = hasOfficer
          ? "官殺相關較顯，適合有架構、責任或管理色彩嘅工作。升遷靠交付同口碑，唔好淨係靠關係。每年至少一次盤點技能清單。"
          : hasOutput
            ? "食傷生財傾向，適合創作、技術輸出、自由專業。作品／案例要公開可見；報價清晰、收款節點寫明，減少扯皮。"
            : "事業宜穩中求進，忌頻繁跳槽而無累積。每份工至少榨乾可帶走嘅技能同人脈，再考慮下一步。";
        break;
      case "財帛":
        text = hasWealth
          ? "財星有氣，理財意識唔差；仍要睇係咪俾人分薄。實用：收入三份——生活、備用、增值；大額投資要有冷靜期，唔好聽「穩賺」口號。"
          : "財星不顯時，宜以技能換財，勿投機。先建被動或半被動現金流（兼職技能、訂閱、分潤），再諗資產配置。";
        break;
      case "田宅":
        text = `田宅同日支、居家氣場相關。日支${chart.day.branch}（${chart.day.nayin}）係你「屋企感覺」嘅底色。遷居或裝修宜揀令自己瞓得著、心情定嘅環境；合約同物業文件務必自己覆核。`;
        break;
      case "父母":
        text = `年柱${chart.year.stem}${chart.year.branch}主祖上父母意象；印星${hasPrint ? "有力，得長輩提攜機會較高——有事可坦誠求助，但記得回報心意" : "不顯，宜自力更生，同時維持定期問候，關係靠溝通唔係靠猜"}。`;
        break;
      case "兄弟":
        text = `手足緣看月柱同比劫。比劫${ss.includes("比") || ss.includes("劫") ? "較顯——有緣亦有競爭，錢銀合作要白紙黑字" : "不顯——獨立性強，聯絡要自己主動"}。實用：節日一句問候，大事先商量，少背後數是非。`;
        break;
      case "朋輩":
        text = "朋輩運同比劫、食傷互動。宜擇能互相成就、講信用嘅人；酒肉應酬過多易耗身耗財。新識朋友三個月內唔好大額借貸或擔保。";
        break;
      case "夫妻":
        text = inputGenderSpouse(chart);
        break;
      case "子女":
        text = hasOutput || hasOfficer
          ? "子女星有氣，親子互動主題明確。教養宜剛柔並濟：規矩要清，情緒要接。自己嘅壓力唔好原封轉嫁落細路。"
          : "子女線平穩，重陪伴質量多於數量。固定「無人機時間」（一齊食飯、散步）往往比昂貴禮物更有用。";
        break;
      case "健康":
        text = `日主${el}，養生宜平衡「生我」同「我剋」兩邊。作息、飲水、適量運動係底線；長期唔舒服要請醫生，呢段唔構成醫療建議。情緒同睡眠優先處理，好多身體警號由呢度嚟。`;
        break;
      case "早年到晚年":
        text = `早年看年柱${chart.year.stem}${chart.year.branch}，青年看月柱${chart.month.stem}${chart.month.branch}，中年看日支${chart.day.branch}，晚年看時柱${chart.hour.stem}${chart.hour.branch}。人生唔係一條直線——每一段有唔同主旋律，關鍵係肯調整節奏。以上係文化參考模板，唔係必準斷語。`;
        break;
      default:
        text = "—";
    }
    return { key, title, text };
  });

  if (liunianYear) {
    sections.push(...liunianSections(chart, liunianYear));
  }

  sections.push(oralSynthesis(chart, liunianYear));

  return {
    label: "規則／模板解讀・文化參考",
    disclaimer: "唔係必然準確之斷語；僅供顧問核對排盤與敘事結構。禁止作為醫療、投資、法律依據。文化參考，唔作必準保證。",
    sections,
  };
}

function inputGenderSpouse(chart: BaziChart) {
  const female = chart.gender === "坤造";
  if (female) {
    return "坤造以官殺為夫星意象。官殺透顯則伴侶主題較明確；相處上宜分清「責任」同「控制」。實用：定期坦白傾期望，大事共同決策，少冷戰。";
  }
  return "乾造以財為妻星意象。財星有氣則伴侶／姻緣主題較清晰；仍要睇係咪俾劫財分薄。實用：感情同錢銀議題分開傾，承諾做到先再許下一個。";
}

/** 流年各方面 + 逐月加長批注 */
function liunianSections(chart: BaziChart, year: number): DomainSection[] {
  const solar = Solar.fromYmd(year, 6, 1);
  const ygz = solar.getLunar().getEightChar().getYear();
  const stem = ygz[0];
  const branch = ygz[1];
  const rel = shishenOf(chart.dayMaster, stem);
  const { mood, tip, noble, petty } = tipForRel(rel);
  const el = chart.dayMasterElement;
  const branchEl = BRANCH_ELEMENT[branch] || "土";

  const out: DomainSection[] = [];

  out.push({
    key: "流年總論",
    title: `流年 ${year}（${ygz}）總論`,
    text: `呢年流年干對你日主係「${rel}」——感覺上${mood}。${tip}${noble ? " 整體偏向貴人／資源主題較易出現，記得主動聯繫幫手。" : petty ? " 小人／爭奪／口舌主題要提高警覺，重要對話留紀錄。" : " 中性流年，成敗多在自身節奏同執行力。"}\n貴人特徵：穩重守信、能指引規則、肯默默幫忙。小人特徵：情緒化操弄、散播是非、表面熱絡背後計較。全年宜：計劃寫低、錢銀分開帳戶、身體唔好硬撐。`,
  });

  // 各方面簡短但每項必寫
  const yearDomains: { key: string; title: string; text: string }[] = [
    {
      key: "流年性格",
      title: "流年・性格／狀態",
      text: `${year}年心態主調係「${rel}」——${mood}。宜接受自己今年情緒起伏有主題，唔好同往年硬比。實用：每週留一段「淨係自己」時間，整理感受再出門應對人。`,
    },
    {
      key: "流年學業",
      title: "流年・學業",
      text: ["正印", "偏印", "食神"].includes(rel)
        ? "今年利進修、考证、系統學習或輸出筆記／課程。宜訂一個可完成嘅學習目標（三個月一期），多過空喊志向。"
        : "學業線唔係主旋律，但仍可偷師：跟專案邊做邊學。考試或交功課月份要預留緩衝，忌臨時抱佛腳。",
    },
    {
      key: "流年事業",
      title: "流年・事業",
      text: ["正官", "七殺", "食神", "傷官"].includes(rel)
        ? "事業主題較突出。有架構嘅崗位或公開輸出都啱；升遷／轉工宜揀「責任清晰」多過「好聽 title」。每月一次向上級或客戶對齊預期。"
        : "事業宜穩守基本盤，少衝動跳槽。把現有工種做到可量化成績，年底先盤點下一步。",
    },
    {
      key: "流年財運",
      title: "流年・財運",
      text: ["正財", "偏財", "食神"].includes(rel)
        ? "財運主題較活，收入機會多同時誘惑都多。宜記帳、設備用金；大額投資冷靜一週再決定，唔好追「必賺」故事。"
        : petty
          ? "錢銀易分薄或有爭奪感。合作先寫合約，借貸要有還款日程；今年主調係守財多過開疆。"
          : "財運平穩，靠技能同勤力換現金。少參與來路不明嘅群組投資。",
    },
    {
      key: "流年田宅",
      title: "流年・田宅／家居",
      text: `流年支${branch}（${branchEl}）同居住、搬遷話題相關。若有裝修或睇樓，留意合約細節同隱藏開支；家居佈置以「瞓得好、行得順」為先，唔使迷信排場。`,
    },
    {
      key: "流年父母",
      title: "流年・父母",
      text: ["正印", "偏印", "正官"].includes(rel)
        ? "同長輩互動機會較多，可求教亦可盡孝。健康話題要主動問、陪診更好；錢銀資助要量力並講清楚。"
        : "父母線要自己維繫：定期問候、節日露面。有分歧宜当面講，少用訊息冷戰。",
    },
    {
      key: "流年兄弟",
      title: "流年・兄弟／手足",
      text: ["比肩", "劫財"].includes(rel)
        ? "手足／近親之間合作同競爭都可能浮現。共同財產、照顧責任要開家庭會議寫低；少喺第三人面前數對方不是。"
        : "手足緣平常，主動約食飯維繫即可。涉及擔保或聯名，三思。",
    },
    {
      key: "流年朋輩",
      title: "流年・朋輩",
      text: petty
        ? "朋友圈要篩選：少出沒是非局，聚會唔好傳話。真正貴人未必最熱鬧嗰個，而係出事肯現身嗰個。"
        : "朋輩可互相成就，適合組局學習或合作小項目。新相識三個月內唔好大額金錢往來。",
    },
    {
      key: "流年夫妻",
      title: "流年・婚姻／配偶",
      text: chart.gender === "坤造"
        ? (["正官", "七殺"].includes(rel)
          ? "伴侶／姻緣主題較明顯。已有伴宜多坦白少猜疑；未有伴可擴社交但唔好急承諾。相處衝突用「我需要」代替指責。"
          : "感情線要經營：固定約會時間、共同處理家務清單。今年宜修關係多過挑新對象。")
        : (["正財", "偏財"].includes(rel)
          ? "伴侶／姻緣主題較活。錢同愛分開傾；承諾要做到。已有伴可一齊規劃財務目標，減少誤會。"
          : "姻緣平穩，重日常溫柔多過儀式感。有矛盾當日清，唔好積到爆。"),
    },
    {
      key: "流年子女",
      title: "流年・子女",
      text: ["食神", "傷官", "正官", "七殺"].includes(rel)
        ? "親子或生育話題較敏感。教養上規矩同陪伴並重；自己情緒波動時，先冷卻再管教。"
        : "子女線平穩。固定親子時光（一齊食飯、行路）足夠；學業督促要一致口徑，父母唔好一個鬆一個緊。",
    },
    {
      key: "流年健康",
      title: "流年・健康",
      text: `日主${el}喺${year}年受流年${ygz}影響，${petty || monthTone(el, branch) === "受剋" ? "壓力同消耗可能偏高，睡眠同肩頸要優先" : "整體可維持，但仍忌爆肝式加班"}。實用：定期檢查、飲水、走動；唔舒服睇醫生，呢度唔係醫療指引。`,
    },
  ];
  out.push(...yearDomains);

  // 逐月：每個月獨立段落，2–4 句
  const months: { label: string; branch: string }[] = [
    { label: "正月", branch: "寅" }, { label: "二月", branch: "卯" }, { label: "三月", branch: "辰" },
    { label: "四月", branch: "巳" }, { label: "五月", branch: "午" }, { label: "六月", branch: "未" },
    { label: "七月", branch: "申" }, { label: "八月", branch: "酉" }, { label: "九月", branch: "戌" },
    { label: "十月", branch: "亥" }, { label: "冬月", branch: "子" }, { label: "臘月", branch: "丑" },
  ];

  months.forEach((m, idx) => {
    const tone = monthTone(el, m.branch);
    const be = BRANCH_ELEMENT[m.branch];
    let body = "";
    if (tone === "生扶") {
      body = `${m.label}（${m.branch}・${be}）對日主較生扶，適合推進重要計劃、面試、公開發表。貴人特徵：肯引薦、講信用、唔搶功——有機會要主動約見面。留意自己會唔會太急，訂一個「本月只攻一件大事」就夠。`;
    } else if (tone === "受剋") {
      body = `${m.label}（${m.branch}・${be}）壓力感可能較大，宜守不宜攻。小人特徵：愛挑刺、散播焦慮、催你即時決定——一律要求書面同冷靜期。健康上留意睡眠同腸胃；錢銀大額開支可延後。`;
    } else if (tone === "耗洩") {
      body = `${m.label}（${m.branch}・${be}）出力換成果嘅月份，忙但要防過勞。適合清任務、交貨、收費，唔適合同時開太多新局。人際上提防「表面義氣、叫你墊錢」嘅人；合約同工時寫清楚。`;
    } else {
      body = `${m.label}（${m.branch}・${be}）節奏偏平穩，適合整理、複盤、維繫關係。貴人未必高調，可能係默默幫你對文件、提點細節嘅人。本月宜做健康檢查或家居小修，積小善成習慣。`;
    }
    // 略為按流年十神加一句實用提示
    if (petty && (idx % 3 === 1)) {
      body += ` 配合流年「${rel}」，呢個月特別要少傳話、少聯署唔清楚嘅文件。`;
    } else if (noble && (idx % 3 === 0)) {
      body += ` 配合流年「${rel}」，適合請教長輩或專業人士，問清楚再行動。`;
    } else {
      body += ` 小貼士：月尾花十五分鐘寫低「做成咗咩、下次改咩」，流年先唔會白過。`;
    }
    out.push({
      key: `流月${idx + 1}`,
      title: `流年批注・${m.label}${m.branch}`,
      text: body,
    });
  });

  return out;
}

/** 口語綜合：把整盤／流年講返做人 */
function oralSynthesis(chart: BaziChart, liunianYear?: number): DomainSection {
  const el = chart.dayMasterElement;
  const tone = elementTone(el);
  const female = chart.gender === "坤造";
  let liunianBit = "";
  if (liunianYear) {
    const ygz = Solar.fromYmd(liunianYear, 6, 1).getLunar().getEightChar().getYear();
    const rel = shishenOf(chart.dayMaster, ygz[0]);
    const { mood } = tipForRel(rel);
    liunianBit = `講到${liunianYear}年（${ygz}），主調大概係「${rel}」——${mood}；記住貴人穩重守信，小人情緒化愛搞是非，遇事先觀察再交心。`;
  }

  const text = [
    `講真，睇完呢個盤，你比較似一個「${tone}」底色嘅人——日主${chart.dayMaster}，${female ? "坤造" : "乾造"}，唔係教科書公仔，而係會喺現實裡試錯、調整嘅真人。`,
    `性格上，月令${chart.month.branch}拉住你日常節奏；屋企同親密關係嗰邊，日支${chart.day.branch}好重要，有事宜講明期望，少靠對方猜。`,
    `事業財運唔使神話化：有架構就守信交付，有輸出就靠作品同收費紀律；錢銀往來寫低，身體同睡眠唔好成日透支。`,
    liunianBit,
    `最後一句實用嘅：命理只係文化參考地圖，唔係判決書。你今日肯做嘅小步驟——回訊息、記一筆帳、早睡一小時——往往比任何「必準」斷語更改變年底成績。`,
  ].filter(Boolean).join("");

  return {
    key: "口語綜合",
    title: "口語綜合",
    text,
  };
}
