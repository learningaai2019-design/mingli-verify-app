import type { TemplateReading, DomainSection } from "@/lib/shared/types";

export interface HDChart {
  Type: string;
  TypeZh: string;
  Strategy: string;
  Authority: string;
  AuthorityZh: string;
  Profile: string;
  Definition: string;
  Angle: string;
  defined_centers: string[];
  undefined_centers: string[];
  channels: { gates: string; centers: string[] }[];
  activated_gates: number[];
  Personality_Sun: string;
  Design_Sun: string;
}

export function hdTemplateReading(chart: HDChart): TemplateReading {
  const sections: DomainSection[] = [
    {
      key: "類型",
      title: "類型／策略",
      text: `${chart.TypeZh}（${chart.Type}）。策略：${chart.Strategy}。模板：按策略運作較易進入「對的自己」狀態。`,
    },
    {
      key: "權威",
      title: "內在權威",
      text: `${chart.AuthorityZh}（${chart.Authority}）。重大決定宜等權威清晰，而非只靠思緒。`,
    },
    {
      key: "輪廓",
      title: "輪廓／定義",
      text: `Profile ${chart.Profile}（${chart.Angle}）；Definition：${chart.Definition}。`,
    },
    {
      key: "中心",
      title: "定義中心",
      text: `定義：${chart.defined_centers.join("、") || "無"}。開放：${chart.undefined_centers.join("、") || "無"}。開放中心易接收他人能量，宜覺察而非認同。`,
    },
    {
      key: "通道",
      title: "通道",
      text: chart.channels.length
        ? chart.channels.map((c) => `${c.gates}（${c.centers.join("-")}）`).join("；")
        : "無完整通道（Reflector 或極少定義）。",
    },
    {
      key: "太陽",
      title: "人格／設計太陽",
      text: `Personality Sun ${chart.Personality_Sun}；Design Sun ${chart.Design_Sun}。閘門為生命主題線索。`,
    },
    {
      key: "事業",
      title: "事業取向（模板）",
      text: chart.Type.includes("Projector")
        ? "投射者宜等邀請再投入領導／指引角色。"
        : chart.Type.includes("Generator")
          ? "生產者／顯示生產者宜對「有共鳴」嘅工作回應，而非硬推。"
          : chart.Type === "Manifestor"
            ? "顯示者宜先告知再行動，減少阻力。"
            : "反映者宜給自己足夠時間感受環境再決定。",
    },
    {
      key: "關係",
      title: "關係（模板）",
      text: "關係中注意開放中心被制約；健康連結建基於權威與策略，而非討好。",
    },
  ];
  return {
    label: "規則／模板解讀・文化參考",
    disclaimer: "人類圖計算：kerykeion 熱帶星曆＋88°太陽弧 Design；閘門輪盤 Gate25@358.25°。非 Jovian 官方授權軟件。",
    sections,
  };
}
