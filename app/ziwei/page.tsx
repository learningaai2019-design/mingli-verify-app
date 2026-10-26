"use client";
import { useState } from "react";
import BirthForm from "@/components/BirthForm";
import ClearDataButton from "@/components/ClearDataButton";
import DomainReading from "@/components/DomainReading";
import ZiweiBoard from "@/components/ZiweiBoard";
import type { BirthInput, TemplateReading } from "@/lib/shared/types";
import type { ZiweiChartView } from "@/lib/ziwei/engine";

export default function ZiweiPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chart, setChart] = useState<ZiweiChartView | null>(null);
  const [reading, setReading] = useState<TemplateReading | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ac)]">紫微斗數</h1>
          <p className="text-sm text-[var(--tx-2)] mt-1">iztro 排盘 · 模板解讀 · 非倪師授權／非專有數據集</p>
        </div>
        <ClearDataButton onClear={() => { setChart(null); setReading(null); setError(""); }} />
      </div>
      <BirthForm
        loading={loading}
        submitLabel="起紫微盤"
        onSubmit={async (input: BirthInput) => {
          setLoading(true);
          setError("");
          try {
            const res = await fetch("/api/ziwei", {
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
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {chart && <ZiweiBoard chart={chart} />}
      {reading && <DomainReading reading={reading} />}
    </div>
  );
}
