"use client";
import { useState } from "react";
import ClearDataButton from "@/components/ClearDataButton";
import type { WugeResult } from "@/lib/name/engine";

export default function NamePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WugeResult | null>(null);

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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
          <h1 className="text-2xl font-semibold text-[var(--ac)]">姓名學</h1>
          <p className="text-sm text-[var(--tx-2)] mt-1">康熙筆畫五格三才 · 熊崎系華語主流（披露）</p>
        </div>
        <ClearDataButton onClear={() => { setResult(null); setName(""); setError(""); }} />
      </div>
      <div className="card p-5 space-y-4">
        <div>
          <label className="label">姓名（繁體佳・唔會儲存）</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：陳大文"
          />
        </div>
        <button type="button" className="btn-primary" disabled={loading || !name.trim()} onClick={analyze}>
          {loading ? "分析中…" : "五格三才分析"}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {result && (
        <div className="card p-5 space-y-4">
          <h2 className="section-title">{result.name}</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {result.chars.map((c, i) => (
              <span key={i} className="badge">
                {c.char} {c.strokes}劃{c.source === "fallback" ? "≈" : ""}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            {result.geHints.map((g) => (
              <div key={g.key} className="rounded-lg border border-[var(--bdr)] p-3">
                <div className="text-[11px] text-[var(--tx-3)]">{g.key}</div>
                <div className="text-xl text-[var(--ac)] font-semibold">{g.value}</div>
              </div>
            ))}
          </div>
          <p className="text-sm">
            三才：<span className="text-[var(--ac)] font-medium">{result.sancai}</span> — {result.sancaiHint}
          </p>
          <div className="space-y-2">
            {result.geHints.map((g) => (
              <p key={g.key} className="text-sm text-[var(--tx-2)]">
                {g.hint}
              </p>
            ))}
          </div>
          <p className="text-xs text-[var(--tx-3)]">{result.disclaimer}</p>
          <span className="badge">規則／模板解讀・文化參考</span>
        </div>
      )}
    </div>
  );
}
