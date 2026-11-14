import type { Metadata } from "next";
import Link from "next/link";
import { TicketCard } from "@/design-system/ticket";
import { createEvent } from "../actions";
import { EventForm } from "../event-form";

export const metadata: Metadata = {
  title: "Nova confraternização",
  robots: { index: false, follow: false },
};

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint"
        >
          ← Confraternizações
        </Link>
        <h1 className="mt-3 font-display text-4xl leading-none">Nova confraternização</h1>
        <p className="mt-2 text-sm text-ink-soft">
          O amigo secreto é opcional: a confraternização existe normalmente sem sorteio.
        </p>
      </div>

      <TicketCard className="p-6 sm:p-8">
        <EventForm action={createEvent} submitLabel="Criar confraternização" />
      </TicketCard>
    </div>
  );
}
