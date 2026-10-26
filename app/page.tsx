import Link from "next/link";

const MODULES = [
  {
    href: "/bazi",
    title: "八字",
    desc: "四柱排盘、真太陽時、十二領域＋流年貴小人／逐月旺衰模板",
  },
  {
    href: "/ziwei",
    title: "紫微斗數",
    desc: "iztro 排盘＋宮位模板解讀（披露流派・非倪師授權）",
  },
  {
    href: "/western",
    title: "西洋占星",
    desc: "熱帶黃道 Placidus＋行星宮位模板解讀",
  },
  {
    href: "/humandesign",
    title: "人類圖",
    desc: "Type／Authority／Profile／Centers／Channels",
  },
  {
    href: "/liuyao",
    title: "六爻",
    desc: "铜钱／手動／時間起卦、装卦、用神、五大纲领短判",
  },
  {
    href: "/name",
    title: "姓名學",
    desc: "康熙筆畫五格三才（熊崎系華語主流）",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-3 pt-4">
        <p className="badge mx-auto">顧問核對用 · Privacy-first</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--tx-0)] tracking-wide">
          命理核對工作台
        </h1>
        <p className="text-[var(--tx-2)] max-w-2xl mx-auto text-sm sm:text-base">
          畀其他人自行輸入出生／姓名／卦象資料，一次跑齊各模組，方便核對準確度。
          資料只留喺瀏覽器記憶體；重新整理即消失。解讀標示為「規則／模板解讀・文化參考」。
        </p>
      </section>
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="card p-5 hover:border-[var(--ac-bdr)] transition-colors block"
          >
            <h2 className="text-lg font-semibold text-[var(--ac)] mb-2">{m.title}</h2>
            <p className="text-sm text-[var(--tx-2)]">{m.desc}</p>
          </Link>
        ))}
      </section>
      <section className="card p-5 text-sm text-[var(--tx-2)] space-y-2">
        <h3 className="section-title">使用聲明</h3>
        <p>本工具為 MIT 風格自研應用，視覺參考公開 demo 美學，並未複製任何專有解讀數據集，亦唔聲稱特定名師授權。</p>
        <p>選填環境變數 <code className="text-[var(--ac)]">OPENAI_API_KEY</code>／Anthropic 僅作可選增強；冇 key 亦完整可用模板引擎。</p>
      </section>
    </div>
  );
}
