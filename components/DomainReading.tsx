import type { TemplateReading } from "@/lib/shared/types";

export default function DomainReading({ reading }: { reading: TemplateReading }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge">{reading.label}</span>
      </div>
      <p className="text-xs text-[var(--tx-3)] leading-relaxed">{reading.disclaimer}</p>
      <div className="space-y-3">
        {reading.sections.map((s) => (
          <section key={s.key} className="border-t border-[var(--bdr)] pt-3">
            <h3 className="section-title">{s.title}</h3>
            <p className="text-sm text-[var(--tx-1)] whitespace-pre-wrap">{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
