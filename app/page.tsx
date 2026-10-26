import Link from "next/link";

const FLOW = [
  { step: "1", title: "跑模組", text: "先做八字一生解讀（十神／格局／用神意識→各域→大運→流年）；再按需要跑紫微宮星四化等。" },
  { step: "2", title: "跟進詢問", text: "每個主模組頁底部有一個整合「跟進詢問」盒——就住已排好嘅盤問某步大運、某年、感情／事業。" },
  { step: "3", title: "比對＋大事核對", text: "去系統比對並排睇各系統；可輸入大事年表，App 自動判中／一半／唔中。" },
];

const MODULES = [
  {
    href: "/bazi",
    title: "八字 · 一生解讀",
    desc: "十神、格局傾向、用神框架 → 性格／學業／事業／財／田宅／父母／兄弟／朋輩／婚姻／子女／健康 → 十年大運 → 流年＋逐月 → 口語綜合；可跟進詢問。",
    primary: true,
  },
  {
    href: "/ziwei",
    title: "紫微 · 宮星四化",
    desc: "十二宮人生域＋四化提要＋口語綜合；可跟進詢問宮位／人生域。非倪師授權。",
    primary: true,
  },
  { href: "/western", title: "西洋占星", desc: "熱帶黃道 Placidus＋行星宮位模板解讀" },
  { href: "/humandesign", title: "人類圖", desc: "Type／Authority／Profile／Centers／Channels" },
  { href: "/liuyao", title: "六爻", desc: "一事一問、装卦、用神、五大纲领短判" },
  { href: "/name", title: "姓名學", desc: "康熙筆畫五格三才（熊崎系華語主流）" },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-3 pt-4">
        <p className="badge mx-auto">顧問級默認輸出 · Privacy-first · 暖色輕盈</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--tx-0)] tracking-wide">
          命理核對工作台
        </h1>
        <p className="text-[var(--tx-2)] max-w-2xl mx-auto text-sm sm:text-base">
          將顧問喺 chat 做過嘅完整解讀收進 App：唔係零碎加功能，而係一次跑出一生／宮星級深度，再用一個跟進詢問入口聚焦追問。
          出生資料只留瀏覽器記憶體；解讀標示「規則／模板解讀・文化參考」。
        </p>
      </section>

      <section className="grid sm:grid-cols-3 gap-3">
        {FLOW.map((f) => (
          <div key={f.step} className="card p-4 text-left">
            <div className="badge mb-2">步驟 {f.step}</div>
            <h2 className="font-semibold text-[var(--ac)] mb-1">{f.title}</h2>
            <p className="text-sm text-[var(--tx-2)]">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="card p-5 hover:border-[var(--ac-bdr)] transition-colors block"
            style={
              m.primary
                ? { borderColor: "var(--ac-bdr)", background: "linear-gradient(145deg, rgba(255,248,240,0.95), rgba(255,228,200,0.55))" }
                : undefined
            }
          >
            <h2 className="text-lg font-semibold text-[var(--ac)] mb-2">{m.title}</h2>
            <p className="text-sm text-[var(--tx-2)]">{m.desc}</p>
          </Link>
        ))}
        <Link
          href="/compare"
          className="card p-5 hover:border-[var(--ac-bdr)] transition-colors block border-[var(--ac-bdr)]"
          style={{ background: "linear-gradient(145deg, rgba(255,248,240,0.95), rgba(255,228,200,0.9))" }}
        >
          <h2 className="text-lg font-semibold text-[var(--ac)] mb-2">系統比對＋大事核對</h2>
          <p className="text-sm text-[var(--tx-2)]">
            並排對照各系統領域；輸入大事年表，App 自動判中／一半／唔中。跟進深挖請返八字／紫微頁底部詢問盒。
          </p>
        </Link>
      </section>

      <section className="card p-5 text-sm text-[var(--tx-2)] space-y-2">
        <h3 className="section-title">使用聲明</h3>
        <p>本工具為 MIT 風格自研應用，視覺參考公開 demo 美學，並未複製任何專有解讀數據集，亦唔聲稱特定名師授權。</p>
        <p>選填環境變數 <code className="text-[var(--ac)]">OPENAI_API_KEY</code>／Anthropic 僅作可選增強；冇 key 亦完整可用模板引擎。</p>
      </section>
    </div>
  );
}
