import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { westernTemplateReading, type WesternChart } from "@/lib/western/reading";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function runPython(script: string, input: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    const py = process.env.ASTRO_PYTHON || "/workspace/.venv-astro/bin/python";
    const child = spawn(py, [script], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => { out += d.toString(); });
    child.stderr.on("data", (d) => { err += d.toString(); });
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(err || `python exit ${code}`));
    });
    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const script = path.join(process.cwd(), "scripts", "western_chart.py");
    const raw = await runPython(script, body);
    const chart = JSON.parse(raw) as WesternChart;
    const reading = westernTemplateReading(chart);
    return NextResponse.json({ chart, reading });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "western failed" }, { status: 500 });
  }
}
