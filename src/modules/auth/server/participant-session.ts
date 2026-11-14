import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ParticipantSession {
  userId: string;
  username: string;
  fullName: string;
}

/** Sessão válida apenas para usuário com perfil de participante. */
export async function getParticipantSession(): Promise<ParticipantSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return { userId: user.id, username: profile.username, fullName: profile.full_name };
}

export async function requireParticipant(): Promise<ParticipantSession> {
  const session = await getParticipantSession();
  if (!session) {
    redirect("/entrar");
  }
  return session;
}
