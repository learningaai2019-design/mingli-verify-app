import Link from "next/link";

const MODULES = [
  {
    href: "/bazi",
    title: "八字 · 一生解讀",
    desc: "十神／格局／用神 → 人生域 → 大運流年；可跟進詢問。",
    primary: true,
  },
  {
    href: "/ziwei",
    title: "紫微 · 宮星四化",
    desc: "十二宮＋四化提要＋口語綜合；可跟進詢問。",
    primary: true,
  },
  { href: "/liuyao", title: "六爻", desc: "一事一問、装卦、用神短判" },
  { href: "/name", title: "姓名學", desc: "康熙筆畫五格三才" },
  { href: "/western", title: "西洋占星", desc: "熱帶黃道 Placidus＋宮位解讀" },
  { href: "/humandesign", title: "人類圖", desc: "Type／Authority／Profile／Centers" },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-3 pt-4">
        <p className="badge mx-auto">顧問級默認輸出 · Privacy-first</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--tx-0)] tracking-wide">
          命理核對工作台
        </h1>
        <p className="text-[var(--tx-2)] max-w-xl mx-auto text-sm sm:text-base">
          選模組排盤解讀，再到系統比對核對大事。出生資料只留瀏覽器；解讀屬規則／模板・文化參考。
        </p>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="card p-5 hover:border-[var(--ac-bdr)] transition-colors block"
            style={
              m.primary
                ? {
                    borderColor: "var(--ac-bdr)",
                    background:
                      "linear-gradient(145deg, rgba(255,248,240,0.95), rgba(255,228,200,0.55))",
                  }
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
          style={{
            background:
              "linear-gradient(145deg, rgba(255,248,240,0.95), rgba(255,228,200,0.9))",
          }}
        >
          <h2 className="text-lg font-semibold text-[var(--ac)] mb-2">系統比對＋大事核對</h2>
          <p className="text-sm text-[var(--tx-2)]">
            並排對照各系統；輸入大事年表，自動判中／一半／唔中。
          </p>
        </Link>
      </section>

      <section className="card p-5 text-sm text-[var(--tx-2)] space-y-2">
        <h3 className="section-title">使用聲明</h3>
        <p>
          本工具為 MIT 風格自研應用，視覺參考公開 demo 美學，並未複製任何專有解讀數據集，亦唔聲稱特定名師授權。
        </p>
        <p>
          選填環境變數 <code className="text-[var(--ac)]">OPENAI_API_KEY</code>
          ／Anthropic 僅作可選增強；冇 key 亦完整可用模板引擎。
        </p>
      </section>
    </div>
  );
}
