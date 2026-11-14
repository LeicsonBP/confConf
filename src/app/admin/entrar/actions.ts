"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveAdminIdentifier } from "@/modules/auth/domain/admin-login";
import { verifyCaptcha } from "@/modules/auth/server/captcha";
import { getAdminSession } from "@/modules/auth/server/session";
import type { LoginState } from "./types";

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
  captchaAnswer: z.string().trim().min(1).max(8),
  captchaToken: z.string().min(10).max(2000),
});

const INVALID = "Usuário ou senha inválidos.";

export async function signInAdmin(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    captchaAnswer: formData.get("captchaAnswer"),
    captchaToken: formData.get("captchaToken"),
  });

  if (!parsed.success) {
    revalidatePath("/admin/entrar");
    return { error: "Preencha usuário, senha e a conta do captcha." };
  }

  if (!verifyCaptcha(parsed.data.captchaToken, parsed.data.captchaAnswer)) {
    revalidatePath("/admin/entrar");
    return { error: "Resposta do captcha incorreta. Tente novamente." };
  }

  const email = resolveAdminIdentifier(parsed.data.identifier);
  if (!email) {
    revalidatePath("/admin/entrar");
    return { error: INVALID };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    revalidatePath("/admin/entrar");
    return { error: INVALID };
  }

  const session = await getAdminSession();
  if (!session) {
    await supabase.auth.signOut();
    revalidatePath("/admin/entrar");
    return { error: INVALID };
  }

  redirect("/admin");
}
