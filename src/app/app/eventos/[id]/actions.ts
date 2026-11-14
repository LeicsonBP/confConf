"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { REPORT_VALUES } from "@/modules/reports/domain/report";
import type { ParticipantActionState } from "./types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function confirmDrawAction(
  _previous: ParticipantActionState,
  formData: FormData,
): Promise<ParticipantActionState> {
  await requireParticipant();

  const eventId = String(formData.get("eventId") ?? "");
  if (!UUID_PATTERN.test(eventId)) {
    return { error: "Confraternização inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_draw", { p_event: eventId });

  if (error) {
    return { error: "Não foi possível confirmar o recebimento." };
  }

  revalidatePath(`/app/eventos/${eventId}`);
  return { success: true };
}

const reportSchema = z.object({
  eventId: z.string().regex(UUID_PATTERN),
  category: z.enum(["recebi_eu_mesmo", "nao_recebi", "outro"]),
  message: z
    .string()
    .trim()
    .min(10, "Descreva o problema com pelo menos 10 caracteres.")
    .max(2000, "A mensagem aceita até 2000 caracteres."),
});

export async function submitReportAction(
  _previous: ParticipantActionState,
  formData: FormData,
): Promise<ParticipantActionState> {
  const session = await requireParticipant();

  const parsed = reportSchema.safeParse({
    eventId: formData.get("eventId"),
    category: formData.get("category"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return { error: message };
  }

  if (!REPORT_VALUES.includes(parsed.data.category)) {
    return { error: "Categoria inválida." };
  }

  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", parsed.data.eventId)
    .eq("user_id", session.userId)
    .is("removed_at", null)
    .maybeSingle();

  if (!participant) {
    return { error: "Participante não encontrado." };
  }

  const { error } = await supabase.from("problem_reports").insert({
    event_id: parsed.data.eventId,
    participant_id: participant.id,
    category: parsed.data.category,
    message: parsed.data.message,
  });

  if (error) {
    return { error: "Não foi possível enviar o relato." };
  }

  revalidatePath(`/app/eventos/${parsed.data.eventId}`);
  return { success: true };
}
