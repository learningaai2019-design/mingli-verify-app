/**
 * Session-only chart snapshot for 跟進詢問.
 * No name／出生日期原文；關分頁即清。
 */
import type { BaziChart } from "@/lib/bazi/engine";
import type { ZiweiChartView } from "@/lib/ziwei/engine";

const BAZI_KEY = "mingli-verify-bazi-chart-v1";
const ZIWEI_KEY = "mingli-verify-ziwei-chart-v1";

function canUse() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function saveBaziChartSession(chart: BaziChart) {
  if (!canUse()) return;
  try {
    sessionStorage.setItem(BAZI_KEY, JSON.stringify({ savedAt: Date.now(), chart }));
  } catch {
    /* ignore */
  }
}

export function loadBaziChartSession(): BaziChart | null {
  if (!canUse()) return null;
  try {
    const raw = sessionStorage.getItem(BAZI_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { chart?: BaziChart };
    return parsed.chart || null;
  } catch {
    return null;
  }
}

export function clearBaziChartSession() {
  if (!canUse()) return;
  try {
    sessionStorage.removeItem(BAZI_KEY);
  } catch {
    /* ignore */
  }
}

export function saveZiweiChartSession(chart: ZiweiChartView) {
  if (!canUse()) return;
  try {
    sessionStorage.setItem(ZIWEI_KEY, JSON.stringify({ savedAt: Date.now(), chart }));
  } catch {
    /* ignore */
  }
}

export function loadZiweiChartSession(): ZiweiChartView | null {
  if (!canUse()) return null;
  try {
    const raw = sessionStorage.getItem(ZIWEI_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { chart?: ZiweiChartView };
    return parsed.chart || null;
  } catch {
    return null;
  }
}

export function clearZiweiChartSession() {
  if (!canUse()) return;
  try {
    sessionStorage.removeItem(ZIWEI_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAllChartSessions() {
  clearBaziChartSession();
  clearZiweiChartSession();
}
