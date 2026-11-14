import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, sameOrigin } from "@/lib/http/origin";
import { PinPolicy } from "@/modules/auth/domain/pin";
import { verifyCaptcha } from "@/modules/auth/server/captcha";
import { verifyRecoveryToken } from "@/modules/auth/server/recovery-token";

const schema = z.object({
  pin: z.string().regex(/^\d{4,8}$/),
  pinConfirm: z.string().regex(/^\d{4,8}$/),
  captchaToken: z.string().min(10).max(2000),
  captchaAnswer: z.string().trim().min(1).max(8),
});

const RECOVERY_COOKIE = "confconf_recovery";

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origem inválida." }, { status: 403 });
  }

  const token = readCookie(request, RECOVERY_COOKIE);
  const verified = token ? verifyRecoveryToken(token) : null;
  if (!verified) {
    return NextResponse.json(
      { ok: false, error: "Sessão de recuperação expirada. Confira os dados e tente de novo." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Informe uma senha numérica de 4 a 8 dígitos." },
      { status: 400 },
    );
  }

  if (parsed.data.pin !== parsed.data.pinConfirm) {
    return NextResponse.json({ ok: false, error: "As senhas não conferem." }, { status: 400 });
  }

  if (!verifyCaptcha(parsed.data.captchaToken, parsed.data.captchaAnswer)) {
    return NextResponse.json(
      { ok: false, error: "Resposta do captcha incorreta." },
      { status: 400 },
    );
  }

  let normalizedPin: string;
  try {
    normalizedPin = PinPolicy.normalize(parsed.data.pin);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Informe uma senha numérica de 4 a 8 dígitos." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();

    const { data: throttle } = await admin.rpc("recovery_throttle", {
      p_key: `reset|${verified.userId}|${clientIp(request)}`,
      p_max: 10,
      p_window_seconds: 3600,
    });
    const throttleRow = Array.isArray(throttle) ? throttle[0] : throttle;
    if (throttleRow && throttleRow.allowed === false) {
      return NextResponse.json(
        { ok: false, error: "Muitas tentativas. Aguarde um tempo e tente novamente." },
        { status: 429 },
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(verified.userId, {
      password: normalizedPin,
    });

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: "Não foi possível alterar a senha agora." },
        { status: 500 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceKey) {
      await fetch(`${url}/auth/v1/admin/users/${verified.userId}/logout`, {
        method: "POST",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      }).catch(() => undefined);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(RECOVERY_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/recuperacao",
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Não foi possível alterar a senha agora." },
      { status: 500 },
    );
  }
}
