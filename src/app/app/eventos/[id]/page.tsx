import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/design-system/button";
import { Stamp, TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { formatCentsToBrl, formatEventDate } from "@/modules/events/domain/event";

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
          Minha lista de desejos
        </ButtonLink>
      </div>

      <TicketCard className="p-6 sm:p-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
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

      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
        Em breve: sorteio.
      </p>
    </div>
  );
}
