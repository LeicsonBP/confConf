"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { Identifier } from "@/modules/auth/domain/identifier";
import { PinPolicy } from "@/modules/auth/domain/pin";
import { verifyCaptcha } from "@/modules/auth/server/captcha";
import type { SignupState } from "./types";

const ALLOWED_RESTRICTIONS = [
  "vegetariano",
  "vegano",
  "sem_lactose",
  "sem_gluten",
  "outra",
] as const;

const signupSchema = z.object({
  tokenHash: z.string().regex(/^[0-9a-f]{64}$/),
  fullName: z.string().trim().min(2, "Informe seu nome completo.").max(120),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe sua data de nascimento."),
  pin: z.string().regex(/^\d{4,8}$/, "O PIN deve ter de 4 a 8 dígitos."),
  pinConfirm: z.string().regex(/^\d{4,8}$/, "Confirme o PIN."),
  other: z.string().trim().max(300, "Máximo de 300 caracteres."),
  captchaToken: z.string().min(10).max(2000),
  captchaAnswer: z.string().trim().min(1).max(8),
});

interface InvitePreview {
  valid?: boolean;
  event?: { name?: string; starts_at?: string; address?: string | null };
}

export async function signUpWithInvite(
  _previous: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    tokenHash: formData.get("tokenHash"),
    fullName: formData.get("fullName"),
    birthDate: formData.get("birthDate"),
    pin: formData.get("pin"),
    pinConfirm: formData.get("pinConfirm"),
    other: formData.get("other") ?? "",
    captchaToken: formData.get("captchaToken"),
    captchaAnswer: formData.get("captchaAnswer"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os campos do cadastro." };
  }

  if (parsed.data.pin !== parsed.data.pinConfirm) {
    return { error: "Os PINs não conferem." };
  }

  if (!verifyCaptcha(parsed.data.captchaToken, parsed.data.captchaAnswer)) {
    return { error: "Resposta do captcha incorreta. Recarregue a página e tente de novo." };
  }

  const birthDate = new Date(`${parsed.data.birthDate}T00:00:00.000Z`);
  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate < new Date("1900-01-01T00:00:00.000Z") ||
    birthDate > new Date()
  ) {
    return { error: "Data de nascimento inválida." };
  }

  const restrictions = formData
    .getAll("restrictions")
    .map(String)
    .filter((value): value is (typeof ALLOWED_RESTRICTIONS)[number] =>
      (ALLOWED_RESTRICTIONS as readonly string[]).includes(value),
    );

  const supabase = await createClient();

  const { data: previewData } = await supabase.rpc("invite_preview", {
    p_token_hash: parsed.data.tokenHash,
  });
  const preview = previewData as InvitePreview | null;
  if (!preview?.valid) {
    return { error: "Este convite não está mais válido. Peça um novo link." };
  }

  const normalizedPin = PinPolicy.normalize(parsed.data.pin);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const username = Identifier.generate(parsed.data.fullName);
    const email = `${username}@participantes.confconf.invalid`;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: normalizedPin,
    });

    if (signUpError) {
      const message = signUpError.message.toLowerCase();
      const conflict =
        message.includes("already") || message.includes("registered") || message.includes("exists");
      if (conflict) continue;
      return { error: "Não foi possível criar sua conta. Tente novamente." };
    }

    if (!signUpData.user) {
      return { error: "Não foi possível criar sua conta." };
    }

    const { error: redeemError } = await supabase.rpc("redeem_invite", {
      p_token_hash: parsed.data.tokenHash,
      p_full_name: parsed.data.fullName,
      p_birth_date: parsed.data.birthDate,
      p_username: username,
      p_restrictions: restrictions,
      p_other: parsed.data.other,
    });

    if (redeemError) {
      await supabase.auth.signOut();
      return { error: "Não foi possível confirmar sua participação. Peça um novo link." };
    }

    return {
      success: true,
      credentials: {
        username,
        pin: parsed.data.pin,
        eventName: preview.event?.name ?? "",
        eventDate: preview.event?.starts_at ?? new Date().toISOString(),
        eventAddress: preview.event?.address ?? null,
      },
    };
  }

  return { error: "Não foi possível gerar seu identificador. Tente novamente." };
}
