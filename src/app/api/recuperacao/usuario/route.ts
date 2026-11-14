import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, sameOrigin } from "@/lib/http/origin";
import { PinPolicy } from "@/modules/auth/domain/pin";
import { verifyCaptcha } from "@/modules/auth/server/captcha";

const schema = z.object({
  password: z.string().min(1).max(200),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  captchaToken: z.string().min(10).max(2000),
  captchaAnswer: z.string().trim().min(1).max(8),
});

const GENERIC = {
  ok: false,
  error: "Não encontramos um cadastro com esses dados.",
};

interface EventInfo {
  name?: string;
  starts_at?: string;
  address?: string | null;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origem inválida." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(GENERIC, { status: 400 });
  }

  if (!verifyCaptcha(parsed.data.captchaToken, parsed.data.captchaAnswer)) {
    return NextResponse.json(
      { ok: false, error: "Resposta do captcha incorreta." },
      { status: 400 },
    );
  }

  let normalizedPassword: string;
  try {
    normalizedPassword = PinPolicy.normalize(parsed.data.password);
  } catch {
    return NextResponse.json(GENERIC, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Serviço indisponível no momento." },
      { status: 500 },
    );
  }

  try {
    const admin = createAdminClient();

    const { data: throttle } = await admin.rpc("recovery_throttle", {
      p_key: `usuario|${clientIp(request)}`,
      p_max: 5,
      p_window_seconds: 3600,
    });
    const throttleRow = Array.isArray(throttle) ? throttle[0] : throttle;
    if (throttleRow && throttleRow.allowed === false) {
      return NextResponse.json(
        { ok: false, error: "Muitas tentativas. Aguarde um tempo e tente novamente." },
        { status: 429 },
      );
    }

    const { data: candidates } = await admin
      .from("profiles")
      .select("id,username")
      .eq("birth_date", parsed.data.birthDate)
      .limit(20);

    for (const candidate of candidates ?? []) {
      const client = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });

      const { error } = await client.auth.signInWithPassword({
        email: `${candidate.username}@participantes.confconf.invalid`,
        password: normalizedPassword,
      });

      if (!error) {
        const { data: participation } = await admin
          .from("event_participants")
          .select("events!event_participants_event_id_fkey(name,starts_at,address)")
          .eq("user_id", candidate.id)
          .is("removed_at", null)
          .order("joined_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const event = (participation as { events?: EventInfo } | null)?.events ?? null;

        await client.auth.signOut().catch(() => undefined);

        return NextResponse.json({
          ok: true,
          username: candidate.username,
          password: parsed.data.password,
          event: event
            ? {
                name: event.name ?? "",
                startsAt: event.starts_at ?? "",
                address: event.address ?? null,
              }
            : null,
        });
      }
    }

    return NextResponse.json(GENERIC, { status: 400 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Não foi possível continuar agora. Tente novamente." },
      { status: 500 },
    );
  }
}
