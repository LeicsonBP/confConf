"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/modules/auth/server/session";
import { eventInputSchema, toEventRow } from "@/modules/events/domain/event";
import type { EventFormState } from "./types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ParseResult =
  | { ok: true; row: ReturnType<typeof toEventRow> }
  | { ok: false; state: EventFormState };

function parseEventFormData(formData: FormData): ParseResult {
  const parsed = eventInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    location: formData.get("location") ?? "",
    address: formData.get("address") ?? "",
    startsAt: formData.get("startsAt") ?? "",
    drawScheduledAt: formData.get("drawScheduledAt") ?? "",
    maxGift: formData.get("maxGift") ?? "",
    extraInfo: formData.get("extraInfo") ?? "",
    hasSecretSanta: formData.get("hasSecretSanta") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, state: { fieldErrors, error: "Revise os campos destacados." } };
  }

  try {
    return { ok: true, row: toEventRow(parsed.data) };
  } catch (error) {
    return {
      ok: false,
      state: { error: error instanceof Error ? error.message : "Dados inválidos." },
    };
  }
}

export async function createEvent(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const session = await requireAdmin();
  const parsed = parseEventFormData(formData);
  if (!parsed.ok) return parsed.state;

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    ...parsed.row,
    created_by: session.userId,
  });

  if (error) {
    return { error: "Não foi possível criar a confraternização. Tente novamente." };
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateEvent(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");
  if (!UUID_PATTERN.test(eventId)) {
    return { error: "Confraternização inválida." };
  }

  const parsed = parseEventFormData(formData);
  if (!parsed.ok) return parsed.state;

  const supabase = await createClient();
  const { error } = await supabase.from("events").update(parsed.row).eq("id", eventId);

  if (error) {
    if (error.message.includes("amigo secreto")) {
      return { error: "Não é possível desligar o amigo secreto depois do sorteio." };
    }
    return { error: "Não foi possível salvar as alterações." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/eventos/${eventId}`);
  redirect(`/admin/eventos/${eventId}`);
}

export async function removeParticipant(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const parsed = z
    .object({ eventId: z.string().regex(UUID_PATTERN), participantId: z.string().regex(UUID_PATTERN) })
    .safeParse({
      eventId: formData.get("eventId"),
      participantId: formData.get("participantId"),
    });

  if (!parsed.success) {
    return { error: "Participante inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_remove_participant", {
    p_event: parsed.data.eventId,
    p_participant: parsed.data.participantId,
  });

  if (error) {
    if (error.message.includes("depois do sorteio")) {
      return { error: "Não é possível remover participantes depois do sorteio." };
    }
    return { error: "Não foi possível remover o participante." };
  }

  revalidatePath(`/admin/eventos/${parsed.data.eventId}`);
  return { success: true };
}

export async function runDraw(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");
  if (!UUID_PATTERN.test(eventId)) {
    return { error: "Confraternização inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("run_draw", { p_event: eventId });

  if (error) {
    if (error.message.includes("já foi realizado")) {
      return { error: "O sorteio já foi realizado." };
    }
    if (error.message.includes("ao menos 2")) {
      return { error: "São necessários ao menos 2 participantes." };
    }
    if (error.message.includes("não tem amigo secreto")) {
      return { error: "Esta confraternização está sem amigo secreto." };
    }
    return { error: "Não foi possível realizar o sorteio." };
  }

  revalidatePath(`/admin/eventos/${eventId}`);
  return { success: true };
}

export async function resolveReport(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const parsed = z
    .object({ eventId: z.string().regex(UUID_PATTERN), reportId: z.string().regex(UUID_PATTERN) })
    .safeParse({
      eventId: formData.get("eventId"),
      reportId: formData.get("reportId"),
    });

  if (!parsed.success) {
    return { error: "Relato inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("problem_reports")
    .update({ status: "resolvido", resolved_at: new Date().toISOString() })
    .eq("id", parsed.data.reportId)
    .eq("event_id", parsed.data.eventId);

  if (error) {
    return { error: "Não foi possível resolver o relato." };
  }

  revalidatePath(`/admin/eventos/${parsed.data.eventId}`);
  return { success: true };
}

export async function cancelDraw(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");
  if (!UUID_PATTERN.test(eventId)) {
    return { error: "Confraternização inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_draw", { p_event: eventId });

  if (error) {
    if (error.message.includes("Não há sorteio")) {
      return { error: "Não há sorteio para desfazer." };
    }
    return { error: "Não foi possível desfazer o sorteio." };
  }

  revalidatePath(`/admin/eventos/${eventId}`);
  return { success: true };
}

export async function deleteEvent(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (!UUID_PATTERN.test(eventId)) {
    return { error: "Confraternização inválida." };
  }

  const supabase = await createClient();
  const { data: event, error: readError } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .maybeSingle();

  if (readError || !event) {
    return { error: "Confraternização não encontrada." };
  }

  if (confirmation !== event.name) {
    return { error: "Digite o nome exato da confraternização para confirmar a exclusão." };
  }

  const { error } = await supabase.rpc("admin_delete_event", { p_event: eventId });

  if (error) {
    return { error: "Não foi possível excluir a confraternização." };
  }

  revalidatePath("/admin");
  redirect("/admin");
}
