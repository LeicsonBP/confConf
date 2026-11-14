export type InviteStatus = "ativo" | "expirado" | "revogado" | "esgotado";

export interface InviteState {
  expiresAt: Date | string;
  revokedAt: Date | string | null;
  usedCount: number;
  maxUses: number | null;
}

export const DEFAULT_INVITE_DAYS = 30;
export const MAX_INVITE_DAYS = 365;
export const MAX_USES_LIMIT = 5000;

export function inviteStatus(invite: InviteState, now: Date): InviteStatus {
  if (invite.revokedAt) return "revogado";
  if (new Date(invite.expiresAt).getTime() <= now.getTime()) return "expirado";
  if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) return "esgotado";
  return "ativo";
}

export function formatInviteUses(usedCount: number, maxUses: number | null): string {
  return maxUses === null ? `${usedCount} (ilimitado)` : `${usedCount} de ${maxUses}`;
}

export function parseInviteDays(raw: string): number {
  const days = Number(raw.trim());
  if (!Number.isInteger(days) || days < 1 || days > MAX_INVITE_DAYS) {
    throw new Error(`A validade deve ser de 1 a ${MAX_INVITE_DAYS} dias.`);
  }
  return days;
}

/** Vazio = usos ilimitados (link para grupo). */
export function parseMaxUses(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;
  const maxUses = Number(value);
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > MAX_USES_LIMIT) {
    throw new Error(`O limite de usos deve ser de 1 a ${MAX_USES_LIMIT}, ou vazio para ilimitado.`);
  }
  return maxUses;
}

export function buildInviteUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/convite/${token}`;
}

export function inviteStatusLabel(status: InviteStatus): string {
  switch (status) {
    case "ativo":
      return "Ativo";
    case "expirado":
      return "Expirado";
    case "revogado":
      return "Revogado";
    case "esgotado":
      return "Esgotado";
  }
}
