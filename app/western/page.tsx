"use client";
import { useState } from "react";
import BirthForm from "@/components/BirthForm";
import ClearDataButton from "@/components/ClearDataButton";
import DomainReading from "@/components/DomainReading";
import type { BirthInput, TemplateReading } from "@/lib/shared/types";
import type { WesternChart } from "@/lib/western/reading";

export default function WesternPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chart, setChart] = useState<WesternChart | null>(null);
  const [reading, setReading] = useState<TemplateReading | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ac)]">西洋占星</h1>
          <p className="text-sm text-[var(--tx-2)] mt-1">熱帶黃道 · Placidus · kerykeion（.venv-astro）</p>
        </div>
        <ClearDataButton onClear={() => { setChart(null); setReading(null); setError(""); }} />
      </div>
      <BirthForm
        loading={loading}
        submitLabel="排西洋盤"
        onSubmit={async (input: BirthInput) => {
          setLoading(true);
          setError("");
          try {
            const res = await fetch("/api/western", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "失敗");
            setChart(data.chart);
            setReading(data.reading);
          } catch (e) {
            setError(e instanceof Error ? e.message : "錯誤");
          } finally {
            setLoading(false);
          }
        }}
      />
      {error && <p className="text-red-400 text-sm whitespace-pre-wrap">{error}</p>}
      {chart && (
        <div className="card p-5 space-y-3">
          <h2 className="section-title">行星落座</h2>
          <p className="text-sm text-[var(--tx-2)]">
            {chart.system} · 上升 {chart.ascendant.signZh} {chart.ascendant.degree}°
          </p>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            {chart.placements.map((p) => (
              <div key={p.planet} className="flex justify-between border-b border-[var(--bdr)] py-1.5">
                <span className="text-[var(--ac)]">{p.planetZh}</span>
                <span className="text-[var(--tx-1)]">
                  {p.signZh} {p.degree}°{p.retrograde ? " R" : ""}
                  {p.house != null ? ` · H${p.house}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {reading && <DomainReading reading={reading} />}
    </div>
  );
}
