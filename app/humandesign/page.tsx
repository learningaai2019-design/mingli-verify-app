"use client";
import { useState } from "react";
import BirthForm from "@/components/BirthForm";
import ClearDataButton from "@/components/ClearDataButton";
import DomainReading from "@/components/DomainReading";
import type { BirthInput, TemplateReading } from "@/lib/shared/types";
import type { HDChart } from "@/lib/humandesign/reading";
import { saveModuleReading } from "@/lib/shared/compare-store";

export default function HumanDesignPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chart, setChart] = useState<HDChart | null>(null);
  const [reading, setReading] = useState<TemplateReading | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ac)]">人類圖</h1>
          <p className="text-sm text-[var(--tx-2)] mt-1">Type / Authority / Profile / Centers / Channels</p>
        </div>
        <ClearDataButton moduleId="humandesign" onClear={() => { setChart(null); setReading(null); setError(""); }} />
      </div>
      <BirthForm
        loading={loading}
        submitLabel="計算人類圖"
        onSubmit={async (input: BirthInput) => {
          setLoading(true);
          setError("");
          try {
            const res = await fetch("/api/humandesign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "失敗");
            setChart(data.chart);
            setReading(data.reading);
            if (data.reading) saveModuleReading("humandesign", data.reading);
          } catch (e) {
            setError(e instanceof Error ? e.message : "錯誤");
          } finally {
            setLoading(false);
          }
        }}
      />
      {error && <p className="text-red-600 text-sm whitespace-pre-wrap">{error}</p>}
      {chart && (
        <div className="card p-5 space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <span className="badge">{chart.TypeZh}</span>
            <span className="badge">{chart.AuthorityZh}</span>
            <span className="badge">Profile {chart.Profile}</span>
            <span className="badge">{chart.Definition}</span>
          </div>
          <p className="text-[var(--tx-2)]">策略：{chart.Strategy}</p>
          <p className="text-[var(--tx-2)]">
            定義中心：{chart.defined_centers.join("、") || "—"}
          </p>
          <p className="text-[var(--tx-2)]">
            通道：{chart.channels.map((c) => c.gates).join("、") || "—"}
          </p>
          <p className="text-[var(--tx-3)] text-xs">
            P Sun {chart.Personality_Sun} · D Sun {chart.Design_Sun}
          </p>
        </div>
      )}
      {reading && <DomainReading reading={reading} />}
    </div>
  );
}
