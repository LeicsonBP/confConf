"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { DIETARY_VALUES } from "@/modules/participants/domain/restrictions";
import type { ProfileFormState } from "./types";

type Dietary = Database["public"]["Enums"]["dietary_restriction"];

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(120, "O nome aceita até 120 caracteres."),
  other: z.string().trim().max(300, "O detalhe aceita até 300 caracteres."),
});

export async function updateProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await requireParticipant();

  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    other: formData.get("other") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados informados." };
  }

  const restrictions = formData
    .getAll("restrictions")
    .map(String)
    .filter((value): value is Dietary => DIETARY_VALUES.includes(value));

  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", session.userId);

  if (profileError) {
    return { error: "Não foi possível salvar seu nome." };
  }

  const { data: participant } = await supabase
    .from("event_participants")
    .select("id")
    .eq("user_id", session.userId)
    .is("removed_at", null)
    .maybeSingle();

  if (participant) {
    const { error: participantError } = await supabase
      .from("event_participants")
      .update({
        dietary_restrictions: restrictions,
        dietary_other: parsed.data.other || null,
      })
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
