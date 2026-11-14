"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/modules/auth/server/session";
import { parseInviteDays, parseMaxUses } from "@/modules/invites/domain/invite";
import { encryptInviteToken, generateInviteToken, hashInviteToken } from "@/modules/invites/server/token";
import type { InviteFormState } from "./invite-types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createSchema = z.object({
  eventId: z.string().regex(UUID_PATTERN),
  label: z.string().trim().max(80, "O nome do convite aceita até 80 caracteres."),
  days: z.string().trim().min(1, "Informe a validade em dias."),
  maxUses: z.string().trim(),
});

export async function createInvite(
  _previous: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const session = await requireAdmin();

  const parsed = createSchema.safeParse({
    eventId: formData.get("eventId"),
    label: formData.get("label") ?? "",
    days: formData.get("days") ?? "30",
    maxUses: formData.get("maxUses") ?? "",
  });

  if (!parsed.success) {
    return { error: "Revise a validade e o nome do convite." };
  }

  let days: number;
  let maxUses: number | null;
  try {
    days = parseInviteDays(parsed.data.days);
    maxUses = parseMaxUses(parsed.data.maxUses);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Dados inválidos." };
  }

  let ciphertext: string;
  try {
    const token = generateInviteToken();
    ciphertext = encryptInviteToken(token);
    const tokenHash = hashInviteToken(token);
    const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();

    const supabase = await createClient();
    const { error } = await supabase.from("invites").insert({
      event_id: parsed.data.eventId,
      token_hash: tokenHash,
      token_ciphertext: ciphertext,
      label: parsed.data.label || null,
      expires_at: expiresAt,
      max_uses: maxUses,
      created_by: session.userId,
    });

    if (error) {
      return { error: "Não foi possível gerar o link. Tente novamente." };
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("APP_SECRET")) {
      return { error: "APP_SECRET não configurado no servidor." };
    }
    return { error: "Não foi possível gerar o link." };
  }

  revalidatePath(`/admin/eventos/${parsed.data.eventId}`);
  return { success: true };
}

const revokeSchema = z.object({
  eventId: z.string().regex(UUID_PATTERN),
  inviteId: z.string().regex(UUID_PATTERN),
});

export async function revokeInvite(
  _previous: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  await requireAdmin();

  const parsed = revokeSchema.safeParse({
    eventId: formData.get("eventId"),
    inviteId: formData.get("inviteId"),
  });

  if (!parsed.success) {
    return { error: "Convite inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.inviteId)
    .eq("event_id", parsed.data.eventId)
    .is("revoked_at", null);

  if (error) {
    return { error: "Não foi possível revogar o convite." };
  }

  revalidatePath(`/admin/eventos/${parsed.data.eventId}`);
  return { success: true };
}
