import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Healthcheck com verificação do banco para monitoramento e smoke tests. */
export async function GET() {
  const started = Date.now();
  let database: "ok" | "error" = "ok";

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("events").select("id").limit(1);
    if (error) database = "error";
  } catch {
    database = "error";
  }

  const status = database === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      service: "confconf",
      database,
      latency_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status: status === "ok" ? 200 : 503 },
  );
}
