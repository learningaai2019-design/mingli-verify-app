"use client";
import { useState } from "react";
import BirthForm from "@/components/BirthForm";
import ClearDataButton from "@/components/ClearDataButton";
import DomainReading from "@/components/DomainReading";
import type { BirthInput, TemplateReading } from "@/lib/shared/types";
import type { BaziChart } from "@/lib/bazi/engine";
import { saveModuleReading } from "@/lib/shared/compare-store";

export default function BaziPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chart, setChart] = useState<BaziChart | null>(null);
  const [reading, setReading] = useState<TemplateReading | null>(null);
  const [liunianYear, setLiunianYear] = useState(String(new Date().getFullYear()));
  const [lastInput, setLastInput] = useState<BirthInput | null>(null);

  async function run(input: BirthInput, year?: number) {
    setLoading(true);
    setError("");
    setLastInput(input);
    try {
      const res = await fetch("/api/bazi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, liunianYear: year ?? parseInt(liunianYear, 10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "失敗");
      setChart(data.chart);
      setReading(data.reading);
      if (data.reading) saveModuleReading("bazi", data.reading);
    } catch (e) {
      setError(e instanceof Error ? e.message : "錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ac)]">八字</h1>
          <p className="text-sm text-[var(--tx-2)] mt-1">
            陽曆→四柱（lunar-javascript）· 可選真太陽時 · 十年大運 · 領域模板＋流年
          </p>
        </div>
        <ClearDataButton
          moduleId="bazi"
          onClear={() => {
            setChart(null);
            setReading(null);
            setError("");
            setLastInput(null);
          }}
        />
      </div>
      <BirthForm onSubmit={(i) => run(i)} loading={loading} showName submitLabel="排八字並解讀" />
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">流年年份</label>
          <input className="input w-32" value={liunianYear} onChange={(e) => setLiunianYear(e.target.value)} />
        </div>
        <button
          type="button"
          className="btn-ghost"
          disabled={!lastInput || loading}
          onClick={() => lastInput && run(lastInput, parseInt(liunianYear, 10))}
        >
          更新流年解讀
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {chart && (
        <div className="card p-5 space-y-3">
          <h2 className="section-title">四柱</h2>
          {chart.trueSolarNote && <p className="text-xs text-[var(--tx-3)]">{chart.trueSolarNote}</p>}
          <div className="grid grid-cols-4 gap-2 text-center">
            {(["year", "month", "day", "hour"] as const).map((k, i) => {
              const p = chart[k];
              const label = ["年柱", "月柱", "日柱", "時柱"][i];
              return (
                <div key={k} className="rounded-lg border border-[var(--bdr)] p-3 bg-white/50">
                  <div className="text-[11px] text-[var(--tx-3)]">{label}</div>
                  <div className="text-2xl text-[var(--ac)] font-semibold mt-1">
                    {p.stem}
                    {p.branch}
                  </div>
                  <div className="text-[11px] text-[var(--tx-3)] mt-1">{p.nayin}</div>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-[var(--tx-2)]">
            {chart.gender} · 日主 {chart.dayMaster}（{chart.dayMasterElement}）
          </p>
          <div className="text-xs text-[var(--tx-3)]">
            十神：{Object.entries(chart.shishen).map(([k, v]) => `${k}=${v}`).join(" · ")}
          </div>
        </div>
      )}
      {chart?.dayun && (
        <div className="card p-5 space-y-4">
          <div>
            <h2 className="section-title">十年大運</h2>
            <p className="text-sm text-[var(--tx-2)] mt-1">{chart.dayun.qiYunNote}</p>
            <p className="text-xs text-[var(--tx-3)] mt-1">
              每步約十年；大事核對會按事件年份對上覆蓋該年嘅大運。文化參考，唔作必準保證。
            </p>
          </div>
          <div className="space-y-3">
            {chart.dayun.steps.map((s) => {
              const nowY = new Date().getFullYear();
              const active = nowY >= s.startYear && nowY <= s.endYear;
              const label = !s.ganZhi || s.ganZhi === "（起運前）" ? "起運前" : s.ganZhi;
              return (
                <div
                  key={s.index}
                  className="rounded-lg border p-3 space-y-2"
                  style={{
                    borderColor: active ? "var(--ac-bdr)" : "var(--bdr)",
                    background: active ? "var(--ac-bg)" : "rgba(255,255,255,0.45)",
                  }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-lg font-semibold text-[var(--ac)]">
                      {label}
                      {s.stemShishen && s.stemShishen !== "—" ? (
                        <span className="text-sm font-normal text-[var(--tx-2)] ml-2">十神 {s.stemShishen}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-[var(--tx-3)]">
                      {s.startYear}–{s.endYear} · 約{s.startAge}–{s.endAge}歲
                      {active ? " · 現運" : ""}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-[var(--tx-2)]">
                    <p><span className="text-[var(--tx-3)]">性格　</span>{s.brief.personality}</p>
                    <p><span className="text-[var(--tx-3)]">事業　</span>{s.brief.career}</p>
                    <p><span className="text-[var(--tx-3)]">財　</span>{s.brief.wealth}</p>
                    <p><span className="text-[var(--tx-3)]">感情　</span>{s.brief.love}</p>
                    <p className="sm:col-span-2"><span className="text-[var(--tx-3)]">健康　</span>{s.brief.health}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {reading && <DomainReading reading={reading} />}
    </div>
  );
}
