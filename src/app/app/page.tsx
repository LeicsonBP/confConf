import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import { requireParticipant } from "@/modules/auth/server/participant-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minha confraternização",
  robots: { index: false, follow: false },
};

export default async function ParticipantHomePage() {
  await requireParticipant();

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id")
    .order("starts_at", { ascending: true })
    .limit(1);

  const first = events?.[0];
  if (first) {
    redirect(`/app/eventos/${first.id}`);
  }

  return (
    <TicketCard className="p-8 text-center sm:p-10">
      <p className="font-display text-2xl">Nenhuma confraternização por aqui</p>
      <p className="mt-2 text-sm text-ink-soft">
        Quando você receber um link de convite, abra-o para entrar em uma confraternização.
      </p>
    </TicketCard>
  );
}
