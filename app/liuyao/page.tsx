"use client";
import { useState } from "react";
import ClearDataButton from "@/components/ClearDataButton";
import type { LiuyaoResult, YaoValue } from "@/lib/liuyao/engine";

const QTYPES = ["一般", "事业", "财运", "感情", "健康", "诉讼", "出行"];
const YAO_OPTS: { v: YaoValue; label: string }[] = [
  { v: 7, label: "少阳 —" },
  { v: 8, label: "少阴 - -" },
  { v: 9, label: "老阳 ○" },
  { v: 6, label: "老阴 ×" },
];

export default function LiuyaoPage() {
  const [mode, setMode] = useState<"coin" | "time" | "manual">("coin");
  const [questionType, setQuestionType] = useState("一般");
  const [manual, setManual] = useState<YaoValue[]>([7, 7, 7, 8, 8, 8]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LiuyaoResult | null>(null);

  async function cast() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/liuyao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          questionType,
          lines: mode === "manual" ? manual : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "失敗");
      setResult(data.result);
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
          <h1 className="text-2xl font-semibold text-[var(--ac)]">六爻</h1>
          <p className="text-sm text-[var(--tx-2)] mt-1">装卦 · 用神 · 五大纲领短判 · 愚人公開線結構披露</p>
        </div>
        <ClearDataButton onClear={() => { setResult(null); setError(""); }} />
      </div>
      <div className="card p-5 space-y-4">
        <div>
          <label className="label">起卦方式</label>
          <div className="flex flex-wrap gap-2">
            {([
              ["coin", "铜钱摇卦"],
              ["time", "時間起卦"],
              ["manual", "手動輸入"],
            ] as const).map(([k, lab]) => (
              <button
                key={k}
                type="button"
                className="px-3 py-1.5 rounded-full text-sm border"
                style={{
                  borderColor: mode === k ? "var(--ac-bdr)" : "var(--bdr)",
                  background: mode === k ? "var(--ac-bg)" : "transparent",
                  color: mode === k ? "var(--ac)" : "var(--tx-2)",
                }}
                onClick={() => setMode(k)}
              >
                {lab}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">問題類型（定用神）</label>
          <select
            className="input"
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
          >
            {QTYPES.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
        {mode === "manual" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {manual.map((v, i) => (
              <div key={i}>
                <label className="label">{["初", "二", "三", "四", "五", "上"][i]}爻</label>
                <select
                  className="input"
                  value={v}
                  onChange={(e) => {
                    const next = [...manual];
                    next[i] = parseInt(e.target.value, 10) as YaoValue;
                    setManual(next);
                  }}
                >
                  {YAO_OPTS.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn-primary" disabled={loading} onClick={cast}>
          {loading ? "起卦中…" : "起卦並装卦"}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {result && (
        <div className="card p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="badge">本卦 {result.benName}</span>
            {result.zhiName && <span className="badge">變卦 {result.zhiName}</span>}
            <span className="badge">{result.yongShen}</span>
          </div>
          <div className="font-mono text-sm space-y-1">
            {[...result.lines].reverse().map((l, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="text-[var(--tx-3)] w-8">{["上", "五", "四", "三", "二", "初"][idx]}</span>
                <span className={l.changing ? "text-[var(--ac)]" : ""}>{l.label}</span>
              </div>
            ))}
          </div>
          <div>
            <h3 className="section-title">短判</h3>
            <p className="text-sm">{result.verdict}</p>
          </div>
          <div>
            <h3 className="section-title">五大纲领提示</h3>
            <ul className="text-sm text-[var(--tx-2)] list-disc pl-5 space-y-1">
              {result.programNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-[var(--tx-3)]">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
