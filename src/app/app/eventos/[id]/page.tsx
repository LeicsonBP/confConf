import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/design-system/button";
import { IconAlert, IconGift, IconInfo } from "@/design-system/icons";
import { PerforatedDivider, Stamp, TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { formatCentsToBrl, formatEventDate } from "@/modules/events/domain/event";
import { confirmDrawAction, submitReportAction } from "./actions";
import { ConfirmDrawForm } from "./confirm-draw-form";
import { ReportForm } from "./report-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confraternização",
  robots: { index: false, follow: false },
};

export default async function ParticipantEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireParticipant();
  const { id } = await params;

  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();

  if (!event) {
    notFound();
  }

  const { data: draw } = await supabase
    .from("draw_runs")
    .select("executed_at")
    .eq("event_id", id)
    .maybeSingle();

  interface Assignment {
    receiver_name: string;
    receiver_participant_id: string;
    confirmed_at: string | null;
  }

  let assignment: Assignment | null = null;
  if (draw) {
    const { data } = await supabase.rpc("get_my_assignment", { p_event: id });
    assignment = (data as Assignment | null) ?? null;
  }

  let gifteeItems: { id: string; title: string; notes: string | null; url: string | null }[] = [];
  if (assignment) {
    const { data } = await supabase
      .from("wishlist_items")
      .select("id,title,notes,url")
      .eq("participant_id", assignment.receiver_participant_id)
      .order("priority", { ascending: true });
    gifteeItems = data ?? [];
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">
          Minha confraternização
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl leading-none">{event.name}</h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
              {formatEventDate(event.starts_at)}
            </p>
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

      <div className="flex flex-wrap gap-3">
        <ButtonLink href={`/app/eventos/${event.id}/desejos`} variant="secondary">
          <IconGift />
          Minha lista de desejos
        </ButtonLink>
      </div>

      <TicketCard className="p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
          <IconInfo size={14} />
          Informações
        </h2>

        <dl className="mt-5 grid gap-5">
          {event.location ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">Local</dt>
              <dd className="mt-1 text-base">{event.location}</dd>
            </div>
          ) : null}
          {event.address ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Endereço
              </dt>
              <dd className="mt-1 text-base">{event.address}</dd>
            </div>
          ) : null}
          {event.description ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Descrição
              </dt>
              <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {event.description}
              </dd>
            </div>
          ) : null}
          {event.extra_info ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Informações adicionais
              </dt>
              <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {event.extra_info}
              </dd>
            </div>
          ) : null}
        </dl>
      </TicketCard>

      <TicketCard className="p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
          <IconGift size={14} />
          Amigo secreto
        </h2>
        <PerforatedDivider className="my-8" />

        {!event.has_secret_santa ? (
          <p className="text-sm text-ink-soft">Esta confraternização está sem amigo secreto.</p>
        ) : !draw ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-soft">
              O sorteio ainda não foi realizado por quem organiza.
            </p>
            {event.draw_scheduled_at ? (
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
                Previsão do sorteio: {formatEventDate(event.draw_scheduled_at)}
              </p>
            ) : null}
          </div>
        ) : assignment ? (
          <div className="flex flex-col gap-6">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
              Sorteio realizado em {formatEventDate(draw.executed_at)}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg">
                Você tirou <strong>{assignment.receiver_name}</strong>.
              </p>
              {assignment.confirmed_at ? <Stamp tone="bottle">Confirmado</Stamp> : null}
            </div>

            {!assignment.confirmed_at ? (
              <ConfirmDrawForm eventId={event.id} action={confirmDrawAction} />
            ) : null}

            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                Lista de desejos de {assignment.receiver_name}
              </h3>
              {gifteeItems.length === 0 ? (
                <p className="mt-2 text-sm text-ink-faint">Ainda não cadastrou presentes.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-3">
                  {gifteeItems.map((item) => (
                    <li key={item.id} className="border-2 border-ink bg-paper p-4">
                      <p className="font-medium">{item.title}</p>
                      {item.notes ? (
                        <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">
                          {item.notes}
                        </p>
                      ) : null}
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mt-1 inline-block text-sm underline decoration-2 underline-offset-4"
                        >
                          Ver link
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Resultado indisponível.</p>
        )}

        <PerforatedDivider className="my-8" />

        <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          <IconAlert size={14} />
          Algum problema?
        </h3>
        <div className="mt-4">
          <ReportForm eventId={event.id} action={submitReportAction} />
        </div>
      </TicketCard>

      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
        Fale com quem organiza se precisar de ajuda.
      </p>
    </div>
  );
}
