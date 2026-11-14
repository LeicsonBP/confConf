import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { submitReportAction } from "../actions";
import { ReportForm } from "../report-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reportar problema",
  robots: { index: false, follow: false },
};

export default async function ParticipantReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireParticipant();
  const { id } = await params;

  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("id,name").eq("id", id).maybeSingle();
  if (!event) notFound();

  const { data: participant } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", id)
    .is("removed_at", null)
    .maybeSingle();

  if (!participant) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/app/eventos/${event.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 font-display text-4xl leading-none">Reportar problema</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Conte o que aconteceu. O relato vai para quem organiza a confraternização e você pode
          continuar usando sua área normalmente.
        </p>
      </div>

      <TicketCard className="p-6 sm:p-8">
        <ReportForm eventId={event.id} action={submitReportAction} />
      </TicketCard>

      <Link
        href={`/app/eventos/${event.id}`}
        className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint underline-offset-4 hover:underline"
      >
        ← Voltar para a confraternização
      </Link>
    </div>
  );
}
