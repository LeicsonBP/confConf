import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Healthcheck simples para monitoramento e smoke tests. */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "confconf",
    timestamp: new Date().toISOString(),
  });
}
