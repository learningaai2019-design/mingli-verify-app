/**
 * 紫微跟進詢問：重用已起盤之宮星四化，聚焦人生域。
 */
import type { ZiweiChartView } from "./engine";
import type { DomainSection, TemplateReading } from "@/lib/shared/types";

const DOMAIN_PALACE: { re: RegExp; palace: string; title: string }[] = [
  { re: /感情|婚姻|夫妻|姻緣|拍拖|伴侶/, palace: "夫妻", title: "夫妻" },
  { re: /事業|工作|官祿|職場|升遷/, palace: "官祿", title: "事業／官祿" },
  { re: /財|錢|財帛|收入/, palace: "財帛", title: "財帛" },
  { re: /健康|疾厄|身體/, palace: "疾厄", title: "健康／疾厄" },
  { re: /性格|命宮|自己/, palace: "命宮", title: "命宮／性格" },
  { re: /父母|長輩/, palace: "父母", title: "父母" },
  { re: /子女|學生|下屬/, palace: "子女", title: "子女" },
  { re: /兄弟|手足/, palace: "兄弟", title: "兄弟" },
  { re: /朋友|交友|朋輩/, palace: "交友", title: "交友" },
  { re: /田宅|屋企|家居|樓/, palace: "田宅", title: "田宅" },
  { re: /福德|精神|內心/, palace: "福德", title: "福德" },
  { re: /遷移|外出|搬|移民/, palace: "遷移", title: "遷移" },
];

function palaceLine(chart: ZiweiChartView, name: string): string {
  const p = chart.palaces.find((x) => x.name === name || x.name === name + "宮");
  if (!p) return `${name}：盤面未取到呢宮。`;
  const majors = (p.majorStars || []).join("、") || "借對宮";
  const sihua = (p.sihua || []).length
    ? `；本宮見四化：${p.sihua!.map((s) => `${s.star}${s.hua}`).join("、")}`
    : "";
  return `${name}（${p.earthlyBranch}）主星 ${majors}${sihua}。`;
}

export function answerZiweiFollowUp(chart: ZiweiChartView, question: string): TemplateReading {
  const q = (question || "").trim().slice(0, 500);
  const sections: DomainSection[] = [{ key: "所問", title: "你問", text: q || "（空白）" }];
  if (!q) {
    sections.push({ key: "跟進", title: "跟進", text: "請寫想聚焦嘅宮位或人生域（感情／事業／財帛等）。" });
  } else {
    const hits = DOMAIN_PALACE.filter((d) => d.re.test(q));
    const list = hits.length ? hits : DOMAIN_PALACE.filter((d) => ["命宮", "官祿", "財帛", "夫妻"].includes(d.palace));
    for (const h of list.slice(0, 4)) {
      sections.push({
        key: `紫微跟進${h.palace}`,
        title: `聚焦・${h.title}`,
        text: `${palaceLine(chart, h.palace)}按宮位職能配合三方四正同四化睇：祿喜機會、權喜主事、科喜名氣文書、忌喜是非耗神——化忌唔等於災難，而係要你醒神收口。文化參考。`,
      });
    }
    if (chart.sihuaSummary) {
      sections.push({
        key: "四化提要",
        title: "本盤四化提要",
        text: chart.sihuaSummary,
      });
    }
  }
  sections.push({
    key: "跟進收束",
    title: "實用收束",
    text: "紫微跟進重用你已起之盤；非倪師授權教材。小步驟改寫結局，大過標籤。",
  });
  return {
    label: "紫微跟進・規則／顧問口語・文化參考",
    disclaimer: "基於本 session 紫微盤聚焦；文化參考，唔作必準保證。",
    sections,
  };
}
