"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { DIETARY_VALUES } from "@/modules/participants/domain/restrictions";
import type { ProfileFormState } from "./types";

type Dietary = Database["public"]["Enums"]["dietary_restriction"];

export async function updateProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await requireParticipant();

  const restrictions = formData
    .getAll("restrictions")
    .map(String)
    .filter((value): value is Dietary => DIETARY_VALUES.includes(value));

  const supabase = await createClient();

  const { data: participant } = await supabase
    .from("event_participants")
    .select("id")
    .eq("user_id", session.userId)
    .is("removed_at", null)
    .maybeSingle();

  if (participant) {
    const { error: participantError } = await supabase
      .from("event_participants")
      .update({ dietary_restrictions: restrictions })
      .eq("id", participant.id);

    if (participantError) {
      if (
        participantError.message.includes("congelado") ||
        participantError.message.includes("sorteio")
      ) {
        return { error: "As restrições não podem ser alteradas depois do sorteio." };
      }
      return { error: "Não foi possível salvar suas restrições." };
    }
  }

  revalidatePath("/app/perfil");
  return { success: true };
}
