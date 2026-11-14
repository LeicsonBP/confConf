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
import { deleteEvent, updateEvent } from "../actions";
import { DeleteEventForm } from "../delete-form";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Evento",
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint"
        >
          ← Eventos
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl leading-none">{event.name}</h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
              {formatEventDate(event.starts_at)}
              {event.location ? ` · ${event.location}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Stamp tone={event.has_secret_santa ? "stamp" : "ink"}>
              {event.has_secret_santa ? "Com sorteio" : "Sem sorteio"}
            </Stamp>
            {event.max_gift_cents !== null ? (
              <Stamp tone="bottle">Até R$ {formatCentsToBrl(event.max_gift_cents)}</Stamp>
            ) : null}
          </div>
        </div>
      </div>

      <TicketCard className="p-6 sm:p-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
          Dados do evento
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
              startsAt: fromIsoToLocalDateTime(event.starts_at),
              maxGift: formatCentsToBrl(event.max_gift_cents),
              extraInfo: event.extra_info ?? "",
              hasSecretSanta: event.has_secret_santa,
            }}
          />
        </div>
      </TicketCard>

      <TicketCard className="border-stamp p-6 sm:p-8">
        <h2 className="font-display text-2xl leading-none text-stamp">Excluir evento</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Ação irreversível. Participantes, convites, listas de desejos e relatos deste evento serão
          apagados junto.
        </p>
        <PerforatedDivider />
        <div className="mt-5">
          <DeleteEventForm action={deleteEvent} eventId={event.id} eventName={event.name} />
        </div>
      </TicketCard>
    </div>
  );
}
