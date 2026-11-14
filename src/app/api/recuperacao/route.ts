import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, sameOrigin } from "@/lib/http/origin";
import { verifyCaptcha } from "@/modules/auth/server/captcha";
import { createRecoveryToken } from "@/modules/auth/server/recovery-token";

const schema = z.object({
  username: z.string().trim().min(4).max(44),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  captchaToken: z.string().min(10).max(2000),
  captchaAnswer: z.string().trim().min(1).max(8),
});

const RECOVERY_COOKIE = "confconf_recovery";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origem inválida." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  if (!verifyCaptcha(parsed.data.captchaToken, parsed.data.captchaAnswer)) {
    return NextResponse.json(
      { ok: false, error: "Resposta do captcha incorreta." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const username = parsed.data.username.trim().toLowerCase();
    const throttleKey = `${username}|${clientIp(request)}`;

    const { data: throttle } = await admin.rpc("recovery_throttle", {
      p_key: throttleKey,
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

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .eq("birth_date", parsed.data.birthDate)
      .maybeSingle();

    const response = NextResponse.json({ ok: true });

    if (profile?.id) {
      const token = createRecoveryToken(profile.id);
      response.cookies.set(RECOVERY_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/api/recuperacao",
        maxAge: 300,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Não foi possível continuar agora. Tente novamente." },
      { status: 500 },
    );
  }
}
