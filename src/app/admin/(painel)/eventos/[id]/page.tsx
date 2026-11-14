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
import {
  cancelDraw,
  deleteEvent,
  removeParticipant,
  resolveReport,
  runDraw,
  saveFoodSelection,
  updateEvent,
} from "../actions";
import { CancelDrawForm } from "./cancel-draw-form";
import { DeleteEventForm } from "../delete-form";
import { EventForm } from "../event-form";
import { createInvite, revokeInvite } from "../invite-actions";
import { labelForRestriction } from "@/modules/participants/domain/restrictions";
import { FOOD_KEYS, FOOD_RULES, buildFoodPlan, formatQuantity } from "@/modules/food-planning/rules";
import { reportCategoryLabel, reportStatusLabel } from "@/modules/reports/domain/report";
import { DrawForm } from "./draw-form";
import { FoodSelectionForm } from "./food-selection-form";
import { InviteForm } from "./invite-form";
import { InviteLink } from "./invite-link";
import { PrintButton } from "./print-button";
import { RemoveParticipantForm } from "./remove-participant-form";
import { ResolveReportForm } from "./resolve-report-form";
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

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const reveal = resolvedSearchParams.revelar === "1";

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

  const { data: draw } = await supabase
    .from("draw_runs")
    .select("executed_at,participant_count")
    .eq("event_id", id)
    .maybeSingle();

  const { data: confirmedRows } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", id)
    .not("confirmed_draw_at", "is", null);
  const confirmedCount = (confirmedRows ?? []).length;

  const { data: reports } = await supabase
    .from("problem_reports")
    .select("id,category,message,status,created_at")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  let assignments: { giver_name: string; receiver_name: string }[] | null = null;
  if (reveal && draw) {
    const { data } = await supabase.rpc("admin_list_assignments", { p_event: id });
    assignments = (data as { giver_name: string; receiver_name: string }[] | null) ?? null;
  }

  const foodSelection = (event.food_selection ?? []).filter((key) => FOOD_KEYS.includes(key));

  const foodPlan = buildFoodPlan(
    (participants ?? []).map((participant) => ({
      fullName: profileMap.get(participant.user_id)?.full_name ?? "Participante",
      restrictions: participant.dietary_restrictions ?? [],
      other: participant.dietary_other ?? null,
    })),
    { selected: foodSelection },
  );

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
            {event.has_secret_santa && event.draw_scheduled_at ? (
              <Stamp tone="bottle">
                Sorteio previsto: {formatEventDate(event.draw_scheduled_at)}
              </Stamp>
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
              drawScheduledAt: event.draw_scheduled_at
                ? fromIsoToLocalDateTime(event.draw_scheduled_at)
                : "",
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
              Planejamento alimentar
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Estimativa a partir de {foodPlan.total} participante(s) ativo(s).
            </p>
          </div>
          <PrintButton />
        </div>
        <PerforatedDivider className="my-8" />

        <FoodSelectionForm
          action={saveFoodSelection}
          eventId={event.id}
          selected={foodSelection}
        />

        <PerforatedDivider className="my-8" />

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              Restrições consolidadas
            </h3>
            <ul className="mt-3 flex flex-col divide-y-2 divide-dashed divide-ink-faint border-2 border-ink bg-paper">
              {foodPlan.restrictions.map((restriction) => (
                <li
                  key={restriction.key}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span>{restriction.label}</span>
                  <span className="font-mono text-base">{restriction.count}</span>
                </li>
              ))}
            </ul>

            {foodPlan.others.length > 0 ? (
              <div className="mt-4 border-2 border-ink bg-paper p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                  Outras restrições
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {foodPlan.others.map((item) => (
                    <li key={`${item.name}-${item.detail}`}>
                      <span className="font-medium">{item.name}:</span> {item.detail}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              Estimativas
            </h3>
            <ul className="mt-3 flex flex-col gap-3">
              {foodPlan.estimates.length === 0 ? (
                <li className="border-2 border-dashed border-ink-faint px-4 py-6 text-sm text-ink-faint">
                  Nenhum item selecionado. Marque o que será comprado e clique em Calcular.
                </li>
              ) : (
                foodPlan.estimates.map((estimate) => (
                  <li key={estimate.key} className="border-2 border-ink bg-paper p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{estimate.label}</span>
                      <span className="font-mono text-sm">
                        {formatQuantity(estimate.quantity, estimate.unit)}
                      </span>
                    </div>
                    {estimate.note ? (
                      <p className="mt-1 text-xs text-ink-faint">{estimate.note}</p>
                    ) : null}
                    {estimate.restricted ? (
                      <p className="mt-2 border-t-2 border-dashed border-ink-faint pt-2 text-sm text-ink-soft">
                        {estimate.restricted.label}:{" "}
                        {formatQuantity(estimate.restricted.quantity, estimate.unit)}{" "}
                        <span className="text-xs">
                          (para {estimate.restricted.count} pessoa(s))
                        </span>
                      </p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>

            <p className="mt-4 text-xs text-ink-faint">
              Estimativa, não é ordem de compra. Quantidades arredondadas para cima em múltiplos de
              5. Premissas por pessoa:{" "}
              {FOOD_RULES.map((rule) =>
                rule.factor !== undefined
                  ? `${rule.label}: ${rule.factor}× pessoas`
                  : `${rule.label}: ${rule.perPerson} ${rule.unit}`,
              ).join(" · ")}
              .
            </p>
          </div>
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          Cálculo em {formatEventDate(foodPlan.generatedAt)}
        </p>
      </TicketCard>

      <TicketCard className="p-6 sm:p-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
          Amigo secreto
        </h2>
        <PerforatedDivider className="my-8" />

        {!event.has_secret_santa ? (
          <p className="text-sm text-ink-soft">
            Esta confraternização está sem amigo secreto.
          </p>
        ) : draw ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <Stamp tone="bottle">Sorteio realizado</Stamp>
              <Stamp>
                {confirmedCount} de {(participants ?? []).length} confirmaram
              </Stamp>
            </div>
            <p className="text-sm text-ink-soft">
              Realizado em {formatEventDate(draw.executed_at)} com {draw.participant_count}{" "}
              participantes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={
                  reveal ? `/admin/eventos/${event.id}` : `/admin/eventos/${event.id}?revelar=1`
                }
                className="inline-flex items-center justify-center border-2 border-ink bg-paper-2 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-ink"
              >
                {reveal ? "Ocultar resultados" : "Revelar resultados"}
              </Link>
            </div>

            {reveal ? (
              assignments && assignments.length > 0 ? (
                <ul className="flex flex-col gap-2 border-2 border-ink bg-paper p-5">
                  {assignments.map((assignment) => (
                    <li
                      key={`${assignment.giver_name}-${assignment.receiver_name}`}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span>{assignment.giver_name}</span>
                      <span className="text-ink-faint">→</span>
                      <span className="font-medium">{assignment.receiver_name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-faint">Nenhum resultado para exibir.</p>
              )
            ) : null}

            <div className="border-t-2 border-dashed border-ink-faint pt-5">
              <CancelDrawForm action={cancelDraw} eventId={event.id} />
            </div>
          </div>
        ) : (
          <DrawForm action={runDraw} eventId={event.id} total={(participants ?? []).length} />
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

      <TicketCard className="p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
              Relatos de problema
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {(reports ?? []).length === 0
                ? "Nenhum relato recebido."
                : `${(reports ?? []).length} relato(s).`}
            </p>
          </div>
        </div>
        <PerforatedDivider className="my-8" />

        {(reports ?? []).length === 0 ? (
          <p className="text-sm text-ink-faint">Tudo tranquilo por aqui.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {(reports ?? []).map((report) => (
              <li key={report.id} className="border-2 border-ink bg-paper p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                      {reportCategoryLabel(report.category)} · {reportStatusLabel(report.status)}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">
                      {report.message}
                    </p>
                  </div>
                  {report.status !== "resolvido" ? (
                    <ResolveReportForm
                      action={resolveReport}
                      eventId={event.id}
                      reportId={report.id}
                    />
                  ) : null}
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
