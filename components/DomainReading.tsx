import type { DomainSection, TemplateReading } from "@/lib/shared/types";

type Block =
  | { type: "open"; item: DomainSection }
  | { type: "collapsed"; item: DomainSection }
  | { type: "group"; group: string; items: DomainSection[] };

function partition(sections: DomainSection[]): Block[] {
  const blocks: Block[] = [];
  for (const s of sections) {
    if (s.group) {
      const last = blocks[blocks.length - 1];
      if (last && last.type === "group" && last.group === s.group) {
        last.items.push(s);
      } else {
        blocks.push({ type: "group", group: s.group, items: [s] });
      }
      continue;
    }
    if (s.defaultCollapsed) {
      blocks.push({ type: "collapsed", item: s });
    } else {
      blocks.push({ type: "open", item: s });
    }
  }
  return blocks;
}

function SectionBody({ s }: { s: DomainSection }) {
  return (
    <div className="space-y-1">
      <h3 className="section-title">{s.title}</h3>
      <p className="text-sm text-[var(--tx-1)] whitespace-pre-wrap">{s.text}</p>
    </div>
  );
}

const GROUP_LABEL: Record<string, string> = {
  流年人生域: "流年・11 人生域（點開展開）",
  流年逐月: "流年・逐月批注（點開展開）",
};

export default function DomainReading({ reading }: { reading: TemplateReading }) {
  const blocks = partition(reading.sections);
  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="badge">{reading.label}</span>
        <span className="text-[11px] text-[var(--tx-3)]">解讀結果</span>
      </div>
      <p className="text-xs text-[var(--tx-3)] leading-relaxed">{reading.disclaimer}</p>
      <div className="space-y-3">
        {blocks.map((b, i) => {
          if (b.type === "open") {
            return (
              <section key={b.item.key} className="border-t border-[var(--bdr)] pt-3">
                <SectionBody s={b.item} />
              </section>
            );
          }
          if (b.type === "collapsed") {
            return (
              <details key={b.item.key} className="border-t border-[var(--bdr)] pt-3 group">
                <summary className="cursor-pointer list-none flex items-center gap-2 section-title select-none">
                  <span className="text-[var(--tx-3)] text-xs font-normal group-open:hidden">▶</span>
                  <span className="text-[var(--tx-3)] text-xs font-normal hidden group-open:inline">▼</span>
                  {b.item.title}
                </summary>
                <p className="text-sm text-[var(--tx-1)] whitespace-pre-wrap mt-2">{b.item.text}</p>
              </details>
            );
          }
          const label = GROUP_LABEL[b.group] || b.group;
          return (
            <details key={`g-${b.group}-${i}`} className="border-t border-[var(--bdr)] pt-3">
              <summary className="cursor-pointer list-none flex items-center gap-2 select-none">
                <span className="section-title">{label}</span>
                <span className="text-[11px] text-[var(--tx-3)]">（{b.items.length}）</span>
              </summary>
              <div className="mt-3 space-y-3 pl-1 border-l-2 border-[var(--bdr)] ml-1">
                {b.items.map((s) => (
                  <section key={s.key} className="pl-3">
                    <SectionBody s={s} />
                  </section>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
