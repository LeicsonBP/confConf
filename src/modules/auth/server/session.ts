import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminSession {
  userId: string;
  email: string | null;
}

/** Sessão válida apenas se o usuário autenticado estiver na allowlist de admins. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("am_i_admin");
  if (error || !isAdmin) return null;

  return { userId: user.id, email: user.email ?? null };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/entrar");
  }
  return session;
}
