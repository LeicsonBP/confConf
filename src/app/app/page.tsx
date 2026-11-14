import type { Metadata } from "next";
import Link from "next/link";
import { PerforatedDivider, Stamp, TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { formatEventDate } from "@/modules/events/domain/event";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minhas confraternizações",
  robots: { index: false, follow: false },
};

export default async function ParticipantHomePage() {
  await requireParticipant();

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id,name,starts_at,location,address,has_secret_santa")
    .order("starts_at", { ascending: true });

  const list = events ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">
          Área do participante
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none">Minhas confraternizações</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {list.length === 0
            ? "Você ainda não participa de nenhuma confraternização."
            : list.length === 1
              ? "1 confraternização."
              : `${list.length} confraternizações.`}
        </p>
      </div>

      {list.length === 0 ? (
        <TicketCard className="p-8 text-center">
          <p className="font-display text-2xl">Nenhum convite por aqui</p>
          <p className="mt-2 text-sm text-ink-soft">
            Quando você receber um link de convite, abra-o para entrar em uma confraternização.
          </p>
        </TicketCard>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((event) => (
            <li key={event.id}>
              <Link href={`/app/eventos/${event.id}`} className="block">
                <TicketCard className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl leading-tight">{event.name}</h2>
                      <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
                        {formatEventDate(event.starts_at)}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                      {event.address ? (
                        <p className="mt-1 text-sm text-ink-soft">{event.address}</p>
                      ) : null}
                    </div>
                    <Stamp tone={event.has_secret_santa ? "stamp" : "ink"}>
                      {event.has_secret_santa ? "Com amigo secreto" : "Sem amigo secreto"}
                    </Stamp>
                  </div>
                  <PerforatedDivider className="my-5" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
                    Ver detalhes →
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
