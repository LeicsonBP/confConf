"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PinPolicy } from "@/modules/auth/domain/pin";
import { verifyCaptcha } from "@/modules/auth/server/captcha";
import { getParticipantSession } from "@/modules/auth/server/participant-session";
import type { ParticipantLoginState } from "./types";

const USERNAME_PATTERN = /^[a-z0-9-]{4,44}$/;
const INVALID = "Usuário ou senha inválidos.";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(44),
  password: z.string().min(1).max(200),
  captchaAnswer: z.string().trim().min(1).max(8),
  captchaToken: z.string().min(10).max(2000),
});

export async function signInParticipant(
  _previous: ParticipantLoginState,
  formData: FormData,
): Promise<ParticipantLoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    captchaAnswer: formData.get("captchaAnswer"),
    captchaToken: formData.get("captchaToken"),
  });

  if (!parsed.success) {
    revalidatePath("/entrar");
    return { error: "Preencha usuário, senha e a conta do captcha." };
  }

  if (!verifyCaptcha(parsed.data.captchaToken, parsed.data.captchaAnswer)) {
    revalidatePath("/entrar");
    return { error: "Resposta do captcha incorreta. Recarregue a página e tente de novo." };
  }

  const username = parsed.data.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    revalidatePath("/entrar");
    return { error: INVALID };
  }

  let normalizedPin: string;
  try {
    normalizedPin = PinPolicy.normalize(parsed.data.password);
  } catch {
    revalidatePath("/entrar");
    return { error: INVALID };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: `${username}@participantes.confconf.invalid`,
    password: normalizedPin,
  });

  if (error) {
    revalidatePath("/entrar");
    return { error: INVALID };
  }

  const session = await getParticipantSession();
  if (!session) {
    await supabase.auth.signOut();
    revalidatePath("/entrar");
    return { error: INVALID };
  }

  redirect("/app");
}
