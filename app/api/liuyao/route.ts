import { NextRequest, NextResponse } from "next/server";
import {
  buildLiuyao,
  checkLiuyaoRefuse,
  coinCast,
  isLiuyaoRefuse,
  timeCast,
  type YaoValue,
} from "@/lib/liuyao/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const refuseEarly = checkLiuyaoRefuse(question);
    if (refuseEarly) {
      return NextResponse.json(
        { refused: true, reason: refuseEarly, question, error: refuseEarly },
        { status: 400 },
      );
    }
    const qType =
      typeof body.questionType === "string" ? body.questionType : undefined;
    let values: YaoValue[];
    if (body.mode === "manual" && Array.isArray(body.lines)) {
      values = body.lines as YaoValue[];
    } else if (body.mode === "time") {
      values = timeCast();
    } else {
      values = coinCast();
    }
    const result = buildLiuyao(values, question, qType);
    if (isLiuyaoRefuse(result)) {
      return NextResponse.json(
        { refused: true, reason: result.reason, question: result.question, error: result.reason },
        { status: 400 },
      );
    }
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "liuyao failed" }, { status: 400 });
  }
}
