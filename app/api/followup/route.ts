import { NextRequest, NextResponse } from "next/server";
import { answerBaziFollowUp } from "@/lib/bazi/followup";
import { answerZiweiFollowUp } from "@/lib/ziwei/followup";
import type { BaziChart } from "@/lib/bazi/engine";
import type { ZiweiChartView } from "@/lib/ziwei/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      module?: string;
      question?: string;
      chart?: BaziChart | ZiweiChartView;
    };
    const question = (body.question || "").trim();
    if (!question) {
      return NextResponse.json({ error: "請輸入問題" }, { status: 400 });
    }
    if (!body.chart) {
      return NextResponse.json({ error: "未有盤面資料——請先跑一次該模組分析" }, { status: 400 });
    }
    const mod = body.module || "bazi";
    if (mod === "ziwei") {
      const reading = answerZiweiFollowUp(body.chart as ZiweiChartView, question);
      return NextResponse.json({ reading });
    }
    const reading = answerBaziFollowUp(body.chart as BaziChart, question);
    return NextResponse.json({ reading });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "followup failed" }, { status: 400 });
  }
}
