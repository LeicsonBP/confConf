"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { wishlistItemSchema } from "@/modules/wishlist/domain/wishlist-item";
import type { WishlistFormState } from "./types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ParticipantContext {
  participantId: string;
}

async function getContext(eventId: string): Promise<ParticipantContext> {
  const session = await requireParticipant();
  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", session.userId)
    .is("removed_at", null)
    .maybeSingle();

  if (!participant) {
    redirect("/app");
  }

  return { participantId: participant.id };
}

function parseItem(formData: FormData) {
  const parsed = wishlistItemSchema.safeParse({
    title: formData.get("title") ?? "",
    notes: formData.get("notes") ?? "",
    url: formData.get("url") ?? "",
    priority: formData.get("priority") ?? 2,
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return {
    ok: true as const,
    item: {
      title: parsed.data.title,
      notes: parsed.data.notes || null,
      url: parsed.data.url || null,
      priority: parsed.data.priority,
    },
  };
}

export async function createWishlistItem(
  _previous: WishlistFormState,
  formData: FormData,
): Promise<WishlistFormState> {
  const eventId = String(formData.get("eventId") ?? "");
  if (!UUID_PATTERN.test(eventId)) return { error: "Confraternização inválida." };

  const { participantId } = await getContext(eventId);
  const parsed = parseItem(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("wishlist_items").insert({
    participant_id: participantId,
    ...parsed.item,
  });

  if (error) return { error: "Não foi possível adicionar o presente." };

  revalidatePath(`/app/eventos/${eventId}/desejos`);
  return { success: true };
}

export async function updateWishlistItem(
  _previous: WishlistFormState,
  formData: FormData,
): Promise<WishlistFormState> {
  const eventId = String(formData.get("eventId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  if (!UUID_PATTERN.test(eventId) || !UUID_PATTERN.test(itemId)) {
    return { error: "Presente inválido." };
  }

  const { participantId } = await getContext(eventId);
  const parsed = parseItem(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("wishlist_items")
    .update(parsed.item)
    .eq("id", itemId)
    .eq("participant_id", participantId);

  if (error) return { error: "Não foi possível salvar as alterações." };

  revalidatePath(`/app/eventos/${eventId}/desejos`);
  return { success: true };
}

export async function deleteWishlistItem(
  _previous: WishlistFormState,
  formData: FormData,
): Promise<WishlistFormState> {
  const eventId = String(formData.get("eventId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  if (!UUID_PATTERN.test(eventId) || !UUID_PATTERN.test(itemId)) {
    return { error: "Presente inválido." };
  }

  const { participantId } = await getContext(eventId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", itemId)
    .eq("participant_id", participantId);

  if (error) return { error: "Não foi possível remover o presente." };

  revalidatePath(`/app/eventos/${eventId}/desejos`);
  return { success: true };
}
