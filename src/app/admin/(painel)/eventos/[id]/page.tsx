import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PerforatedDivider, Stamp, TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import {
  formatCentsToBrl,
  formatEventDate,
  fromIsoToLocalDateTime,
} from "@/modules/events/domain/event";
import {
  buildInviteUrl,
  formatInviteUses,
  inviteStatus,
  inviteStatusLabel,
} from "@/modules/invites/domain/invite";
import { decryptInviteToken } from "@/modules/invites/server/token";
import { deleteEvent, removeParticipant, updateEvent } from "../actions";
import { DeleteEventForm } from "../delete-form";
import { EventForm } from "../event-form";
import { createInvite, revokeInvite } from "../invite-actions";
import { labelForRestriction } from "@/modules/participants/domain/restrictions";
import { InviteForm } from "./invite-form";
import { InviteLink } from "./invite-link";
import { RemoveParticipantForm } from "./remove-participant-form";
import { RevokeInviteForm } from "./revoke-form";

function formatBirthDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confraternização",
  robots: { index: false, follow: false },
};

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  const { data: invites } = await supabase
    .from("invites")
    .select("id,label,expires_at,used_count,max_uses,revoked_at,token_ciphertext")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  const { data: participants } = await supabase
    .from("event_participants")
    .select("id,user_id,dietary_restrictions,dietary_other,joined_at")
    .eq("event_id", id)
    .is("removed_at", null)
    .order("joined_at", { ascending: true });

  let profiles: { id: string; full_name: string; username: string; birth_date: string }[] = [];
  const userIds = (participants ?? []).map((participant) => participant.user_id);
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,username,birth_date")
      .in("id", userIds);
    profiles = data ?? [];
  }
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const now = new Date();
  const inviteItems = (invites ?? []).map((invite) => {
    const token = invite.token_ciphertext ? decryptInviteToken(invite.token_ciphertext) : null;
    return {
      id: invite.id,
      label: invite.label,
      expiresAt: invite.expires_at,
      usedCount: invite.used_count,
      maxUses: invite.max_uses,
      status: inviteStatus(
        {
          expiresAt: invite.expires_at,
          revokedAt: invite.revoked_at,
          usedCount: invite.used_count,
          maxUses: invite.max_uses,
        },
        now,
      ),
      url: token ? (appUrl ? buildInviteUrl(appUrl, token) : `/convite/${token}`) : null,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint"
        >
          ← Confraternizações
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl leading-none">{event.name}</h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
              {formatEventDate(event.starts_at)}
              {event.location ? ` · ${event.location}` : ""}
            </p>
            {event.address ? (
              <p className="mt-1 text-sm text-ink-soft">{event.address}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Stamp tone={event.has_secret_santa ? "stamp" : "ink"}>
              {event.has_secret_santa ? "Com amigo secreto" : "Sem amigo secreto"}
            </Stamp>
            {event.max_gift_cents !== null ? (
              <Stamp tone="bottle">Até R$ {formatCentsToBrl(event.max_gift_cents)}</Stamp>
            ) : null}
          </div>
        </div>
      </div>

      <TicketCard className="p-6 sm:p-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
          Dados da confraternização
        </h2>
        <div className="mt-5">
          <EventForm
            action={updateEvent}
            eventId={event.id}
            submitLabel="Salvar alterações"
            initial={{
              name: event.name,
              description: event.description ?? "",
              location: event.location ?? "",
              address: event.address ?? "",
              startsAt: fromIsoToLocalDateTime(event.starts_at),
              maxGift: formatCentsToBrl(event.max_gift_cents),
              extraInfo: event.extra_info ?? "",
              hasSecretSanta: event.has_secret_santa,
            }}
          />
        </div>
      </TicketCard>

      <TicketCard className="p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
              Participantes
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {(participants ?? []).length === 0
                ? "Ninguém entrou ainda. Compartilhe um link de convite."
                : `${(participants ?? []).length} pessoa(s) confirmada(s) neste evento.`}
            </p>
          </div>
        </div>

        <PerforatedDivider className="my-8" />

        {(participants ?? []).length === 0 ? (
          <p className="text-sm text-ink-faint">Nenhum participante cadastrado.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {(participants ?? []).map((participant) => {
              const profile = profileMap.get(participant.user_id);
              const restrictions = participant.dietary_restrictions ?? [];

              return (
                <li key={participant.id} className="border-2 border-ink bg-paper p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg leading-tight">
                        {profile?.full_name ?? "Participante"}
                      </p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint">
                        {profile?.username ?? participant.user_id}
                        {profile?.birth_date ? ` · ${formatBirthDate(profile.birth_date)}` : ""}
                      </p>

                      {restrictions.length > 0 ? (
                        <p className="mt-2 text-sm text-ink-soft">
                          Restrições:{" "}
                          {restrictions.map((value) => labelForRestriction(value)).join(", ")}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-ink-faint">Sem restrições informadas</p>
                      )}

                      {participant.dietary_other ? (
                        <p className="mt-1 text-sm text-ink-soft">
                          Detalhe: {participant.dietary_other}
                        </p>
                      ) : null}
                    </div>

                    <RemoveParticipantForm
                      action={removeParticipant}
                      eventId={event.id}
                      participantId={participant.id}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </TicketCard>

      <TicketCard className="p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
              Convites
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              O link é <strong>reutilizável</strong> e fica sempre visível aqui: mande no grupo da
              família, no WhatsApp ou onde quiser. Cada pessoa que abrir se cadastra sozinha.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <InviteForm action={createInvite} eventId={event.id} />
        </div>

        <PerforatedDivider className="my-8" />

        {inviteItems.length === 0 ? (
          <p className="mt-5 text-sm text-ink-faint">Nenhum link gerado ainda.</p>
        ) : (
          <ul className="mt-5 flex flex-col gap-5">
            {inviteItems.map((invite) => (
              <li key={invite.id} className="border-2 border-ink bg-paper p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg leading-none">
                      {invite.label ?? "Convite sem nome"}
                    </p>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint">
                      Válido até {formatEventDate(invite.expiresAt)} ·{" "}
                      {formatInviteUses(invite.usedCount, invite.maxUses)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stamp tone={invite.status === "ativo" ? "bottle" : "ink"}>
                      {inviteStatusLabel(invite.status)}
                    </Stamp>
                    {invite.status === "ativo" ? (
                      <RevokeInviteForm
                        action={revokeInvite}
                        eventId={event.id}
                        inviteId={invite.id}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 border-t-2 border-dashed border-ink-faint pt-4">
                  {invite.url ? (
                    <InviteLink url={invite.url} />
                  ) : (
                    <p className="text-sm text-stamp">
                      Link indisponível — APP_SECRET diferente do usado na geração.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </TicketCard>

      <TicketCard className="border-stamp p-6 sm:p-8">
        <h2 className="font-display text-2xl leading-none text-stamp">
          Excluir confraternização
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Ação irreversível. Participantes, convites, listas de desejos e relatos desta
          confraternização serão apagados junto.
        </p>
        <PerforatedDivider className="my-8" />
        <div className="mt-5">
          <DeleteEventForm action={deleteEvent} eventId={event.id} eventName={event.name} />
        </div>
      </TicketCard>
    </div>
  );
}
