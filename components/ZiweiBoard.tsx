import type { ZiweiChartView } from "@/lib/ziwei/engine";

/** Compact 4x4-ish palace board aesthetic (dark elegant). */
export default function ZiweiBoard({ chart }: { chart: ZiweiChartView }) {
  // Display palaces in a simple responsive grid
  return (
    <div className="card p-4">
      <div className="flex flex-wrap gap-2 text-xs text-[var(--tx-3)] mb-3">
        <span className="badge">五行局 {chart.fiveElementsClass || "—"}</span>
        <span className="badge">命主 {chart.soul}</span>
        <span className="badge">身主 {chart.body}</span>
        {chart.trueSolarNote && <span>{chart.trueSolarNote}</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {chart.palaces.map((p) => (
          <div
            key={p.name + p.earthlyBranch}
            className="rounded-lg border border-[var(--bdr)] p-2 min-h-[96px]"
            style={{
              background: p.isMing ? "rgba(212,168,67,0.08)" : "rgba(255,255,255,0.02)",
              borderColor: p.isMing ? "var(--ac-bdr)" : "var(--bdr)",
            }}
          >
            <div className="flex justify-between text-[11px] text-[var(--tx-3)]">
              <span className="text-[var(--ac)] font-medium">{p.name}</span>
              <span>{p.earthlyBranch}</span>
            </div>
            <div className="mt-1 text-sm text-[var(--tx-0)] font-medium">
              {p.majorStars.join(" ") || "（借對宮）"}
            </div>
            <div className="mt-1 text-[10px] text-[var(--tx-3)] leading-snug">
              {p.minorStars.join(" ")}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-[var(--tx-3)]">{chart.schoolNote}</p>
    </div>
  );
}
