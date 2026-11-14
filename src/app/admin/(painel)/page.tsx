import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/design-system/button";
import { IconArrowRight } from "@/design-system/icons";
import { PerforatedDivider, Stamp, TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/modules/events/domain/event";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confraternizações",
  robots: { index: false, follow: false },
};

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id,name,starts_at,location,has_secret_santa")
    .order("starts_at", { ascending: true });

  const list = events ?? [];
  const counts = new Map<string, number>();

  if (list.length > 0) {
    const { data: participants } = await supabase
      .from("event_participants")
      .select("event_id")
      .in(
        "event_id",
        list.map((event) => event.id),
      )
      .is("removed_at", null);

    for (const row of participants ?? []) {
      counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">
            Área do administrador
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none">Confraternizações</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {list.length === 0
              ? "Nenhuma confraternização cadastrada ainda."
              : list.length === 1
                ? "1 confraternização cadastrada."
                : `${list.length} confraternizações cadastradas.`}
          </p>
        </div>
        <ButtonLink href="/admin/eventos/novo" variant="primary">
          Nova confraternização
        </ButtonLink>
      </div>

      {error ? (
        <p role="alert" className="border-2 border-stamp px-3 py-2 text-sm text-stamp">
          Não foi possível carregar as confraternizações. Recarregue a página.
        </p>
      ) : null}

      {list.length === 0 ? (
        <TicketCard className="p-8 text-center">
          <p className="font-display text-2xl">A festa começa com um convite</p>
          <p className="mt-2 text-sm text-ink-soft">
            Crie a primeira confraternização para depois gerar os convites dos participantes.
          </p>
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/admin/eventos/novo" variant="primary">
              Criar primeira confraternização
            </ButtonLink>
          </div>
        </TicketCard>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((event) => (
            <li key={event.id}>
              <Link href={`/admin/eventos/${event.id}`} className="block transition-transform">
                <TicketCard className="p-6 hover:-translate-y-0.5 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl leading-tight">{event.name}</h2>
                      <p className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
                        {formatEventDate(event.starts_at)}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Stamp tone={event.has_secret_santa ? "stamp" : "ink"}>
                        {event.has_secret_santa ? "Com amigo secreto" : "Sem amigo secreto"}
                      </Stamp>
                      <Stamp tone="bottle">
                        {counts.get(event.id) ?? 0} participante(s)
                      </Stamp>
                    </div>
                  </div>
                  <PerforatedDivider className="my-5" />
                  <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
                    Acessar confraternização
                    <IconArrowRight size={14} />
                  </p>
                </TicketCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
