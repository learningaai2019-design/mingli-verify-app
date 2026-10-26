"use client";
import { useState } from "react";
import DomainReading from "@/components/DomainReading";
import type { TemplateReading } from "@/lib/shared/types";

const CHIPS_BAZI = [
  "而家呢步十年大運點睇？",
  "今年事業同財運有咩重點？",
  "感情／婚姻線點樣經營？",
  "健康同作息要注意咩？",
];

const CHIPS_ZIWEI = [
  "命宮同性格底色？",
  "官祿事業點發揮？",
  "夫妻宮感情提醒？",
  "財帛同四化點睇？",
];

export default function FollowUpAsk({
  module,
  chart,
  disabledReason,
}: {
  module: "bazi" | "ziwei";
  chart: unknown | null;
  disabledReason?: string;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState<TemplateReading | null>(null);
  const chips = module === "ziwei" ? CHIPS_ZIWEI : CHIPS_BAZI;

  async function submit(question: string) {
    const text = question.trim();
    if (!text) return;
    if (!chart) {
      setError(disabledReason || "請先完成排盤解讀，先可以跟進詢問。");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, question: text, chart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "失敗");
      setReading(data.reading);
    } catch (e) {
      setError(e instanceof Error ? e.message : "錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 space-y-4 border-[var(--ac-bdr)]" id="follow-up">
      <div>
        <h2 className="section-title mb-1">跟進詢問</h2>
        <p className="text-sm text-[var(--tx-2)]">
          一個整合入口：就住已排好嘅{module === "ziwei" ? "紫微" : "八字"}盤，問某步大運、某一年、感情／事業等。
          重用 session 盤面，唔另開雜項功能。
        </p>
      </div>
      {!chart && (
        <p className="text-sm text-[var(--tx-3)]">
          {disabledReason || "尚未有盤面——請先喺上面跑一次分析。"}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className="px-3 py-1.5 rounded-full text-xs border"
            style={{ borderColor: "var(--bdr)", color: "var(--tx-2)", background: "rgba(255,255,255,0.5)" }}
            disabled={!chart || loading}
            onClick={() => {
              setQ(c);
              void submit(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div>
        <label className="label">你想問咩？（可寫年份，例如 2018 大運／2024 流年）</label>
        <textarea
          className="input min-h-[88px]"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="例：2015–2024 呢步大運感情同事業點樣？／2026 年要注意咩？"
          disabled={!chart || loading}
        />
      </div>
      <button
        type="button"
        className="btn-primary"
        disabled={!chart || loading || !q.trim()}
        onClick={() => void submit(q)}
      >
        {loading ? "分析中…" : "產出聚焦分析"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {reading && <DomainReading reading={reading} />}
    </div>
  );
}
