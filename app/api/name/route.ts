import { NextRequest, NextResponse } from "next/server";
import { analyzeName } from "@/lib/name/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = analyzeName(String(body.name || ""));
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "name failed" }, { status: 400 });
  }
}
