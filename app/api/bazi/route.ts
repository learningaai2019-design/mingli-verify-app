import { NextRequest, NextResponse } from "next/server";
import { computeBazi, baziTemplateReading } from "@/lib/bazi/engine";
import type { BirthInput } from "@/lib/shared/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BirthInput & { liunianYear?: number };
    const chart = computeBazi(body);
    const reading = baziTemplateReading(chart, body.liunianYear);
    // Do not log body / chart PII
    return NextResponse.json({ chart, reading });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "bazi failed" }, { status: 400 });
  }
}
