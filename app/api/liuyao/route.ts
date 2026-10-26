import { NextRequest, NextResponse } from "next/server";
import { buildLiuyao, coinCast, timeCast, type YaoValue } from "@/lib/liuyao/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const q = body.questionType || "一般";
    let values: YaoValue[];
    if (body.mode === "manual" && Array.isArray(body.lines)) {
      values = body.lines as YaoValue[];
    } else if (body.mode === "time") {
      values = timeCast();
    } else {
      values = coinCast();
    }
    const result = buildLiuyao(values, q);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "liuyao failed" }, { status: 400 });
  }
}
