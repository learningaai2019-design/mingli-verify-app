"use client";
import { useState } from "react";
import Link from "next/link";
import BirthForm from "@/components/BirthForm";
import ClearDataButton from "@/components/ClearDataButton";
import DomainReading from "@/components/DomainReading";
import FollowUpAsk from "@/components/FollowUpAsk";
import ZiweiBoard from "@/components/ZiweiBoard";
import type { BirthInput, TemplateReading } from "@/lib/shared/types";
import type { ZiweiChartView } from "@/lib/ziwei/engine";
import { saveModuleReading } from "@/lib/shared/compare-store";
import { saveZiweiChartSession } from "@/lib/shared/session-chart";

export default function ZiweiPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chart, setChart] = useState<ZiweiChartView | null>(null);
  const [reading, setReading] = useState<TemplateReading | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ac)]">紫微斗數 · 宮星四化</h1>
          <p className="text-sm text-[var(--tx-2)] mt-1">
            十二宮人生域＋四化提要＋口語綜合；非倪師授權。下方可跟進詢問某一宮／人生域。
          </p>
        </div>
        <ClearDataButton
          moduleId="ziwei"
          onClear={() => {
            setChart(null);
            setReading(null);
            setError("");
          }}
        />
      </div>
      <BirthForm
        loading={loading}
        submitLabel="起盤並解讀"
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
            if (data.reading) saveModuleReading("ziwei", data.reading);
            if (data.chart) saveZiweiChartSession(data.chart);
          } catch (e) {
            setError(e instanceof Error ? e.message : "錯誤");
          } finally {
            setLoading(false);
          }
        }}
      />
      <div className="flex justify-end">
        <Link href="/compare" className="btn-ghost">
          去系統比對／大事核對 →
        </Link>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {chart && <ZiweiBoard chart={chart} />}
      {reading && <DomainReading reading={reading} />}
      <FollowUpAsk module="ziwei" chart={chart} />
    </div>
  );
}
