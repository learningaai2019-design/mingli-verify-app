import { NextRequest, NextResponse } from "next/server";
import { computeZiwei, ziweiTemplateReading } from "@/lib/ziwei/engine";
import type { BirthInput } from "@/lib/shared/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BirthInput;
    const chart = computeZiwei(body);
    const reading = ziweiTemplateReading(chart);
    return NextResponse.json({ chart, reading });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "ziwei failed" }, { status: 400 });
  }
}
