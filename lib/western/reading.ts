import type { TemplateReading, DomainSection } from "@/lib/shared/types";

export interface WesternChart {
  system: string;
  ascendant: { sign: string; signZh: string; degree: number };
  placements: {
    planet: string; planetZh: string; sign: string; signZh: string;
    degree: number; house?: string | number | null; retrograde?: boolean;
  }[];
  houses: { house: number; sign: string; signZh: string; degree: number }[];
}

const DOMAIN_PLANETS: { key: string; title: string; planets: string[] }[] = [
  { key: "性格", title: "性格", planets: ["sun", "asc"] },
  { key: "情緒", title: "情緒／內在", planets: ["moon"] },
  { key: "思考", title: "思考表達", planets: ["mercury"] },
  { key: "感情", title: "感情價值", planets: ["venus"] },
  { key: "行動", title: "行動欲望", planets: ["mars"] },
  { key: "事業", title: "事業擴張", planets: ["jupiter", "saturn"] },
  { key: "財帛", title: "財帛資源", planets: ["venus", "jupiter"] },
  { key: "健康", title: "健康節奏", planets: ["mars", "saturn"] },
  { key: "關係", title: "伴侶關係", planets: ["venus", "mars"] },
  { key: "父母", title: "父母意象", planets: ["saturn", "sun", "moon"] },
  { key: "子女", title: "子女創意", planets: ["sun", "jupiter"] },
  { key: "早年到晚年", title: "人生節奏", planets: ["saturn", "uranus", "neptune", "pluto"] },
];

function find(p: WesternChart, key: string) {
  return p.placements.find((x) => x.planet === key);
}

export function westernTemplateReading(chart: WesternChart): TemplateReading {
  const sections: DomainSection[] = DOMAIN_PLANETS.map(({ key, title, planets }) => {
    const bits = planets.map((pk) => {
      if (pk === "asc") return `上升${chart.ascendant.signZh}`;
      const pl = find(chart, pk);
      if (!pl) return "";
      return `${pl.planetZh}在${pl.signZh}${pl.retrograde ? "（逆行）" : ""}`;
    }).filter(Boolean);
    return {
      key,
      title,
      text: `${bits.join("、")}。模板敘事：以此配置為主題入口，實際仍需看宮位相位整體。`,
    };
  });
  sections.unshift({
    key: "總論",
    title: "盤面總論",
    text: `${chart.system}；上升${chart.ascendant.signZh} ${chart.ascendant.degree}°。以下為規則／模板解讀・文化參考。`,
  });
  const sun = find(chart, "sun");
  const moon = find(chart, "moon");
  sections.push({
    key: "口語綜合",
    title: "口語綜合",
    text: `講真，呢張西洋盤最易被見到嘅一面係上升${chart.ascendant.signZh}，內心節奏則多睇月亮${moon ? moon.signZh : "—"}，生命主題核心係太陽${sun ? sun.signZh : "—"}——三者一齊先組成「你呢個人」，唔係單一星座標籤。感情同事業唔使神話化：金星／火星話你點樣連結，木土話你點樣擴張同負責；實用做法係重大決定留冷靜期、錢銀同承諾分開傾。健康節奏跟火星同土星——出力要有恢復，長期唔舒服要請醫生。占星只係文化參考地圖，你今日肯做嘅小步驟，往往比任何「必準」斷語更改變年底成績。`,
  });
  return {
    label: "規則／模板解讀・文化參考",
    disclaimer: "西洋占星採用熱帶黃道＋Placidus；解讀為模板引擎，非專業一對一諮詢。文化參考，唔作必準保證。",
    sections,
  };
}
