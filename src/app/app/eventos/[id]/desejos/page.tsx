import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PerforatedDivider, TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { createWishlistItem, deleteWishlistItem, updateWishlistItem } from "./actions";
import { WishlistItemRow } from "./item-row";
import { NewWishlistItemForm } from "./new-item-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minha lista de desejos",
  robots: { index: false, follow: false },
};

export default async function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: items } = await supabase
    .from("wishlist_items")
    .select("id,title,notes,url,priority")
    .eq("participant_id", participant.id)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  const list = items ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/app/eventos/${event.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 font-display text-4xl leading-none">Minha lista de desejos</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Quem tirar você no amigo secreto vê esta lista. Vale link, cor, tamanho — quanto mais
          detalhe, melhor.
        </p>
      </div>

      <TicketCard className="p-6 sm:p-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
          Adicionar presente
        </h2>
        <PerforatedDivider className="my-8" />
        <NewWishlistItemForm eventId={event.id} action={createWishlistItem} />
      </TicketCard>

      <TicketCard className="p-6 sm:p-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
          Meus presentes
        </h2>
        <PerforatedDivider className="my-8" />

        {list.length === 0 ? (
          <p className="text-sm text-ink-faint">Sua lista está vazia por enquanto.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {list.map((item) => (
              <WishlistItemRow
                key={item.id}
                item={item}
                eventId={event.id}
                updateAction={updateWishlistItem}
                deleteAction={deleteWishlistItem}
              />
            ))}
          </ul>
        )}
      </TicketCard>
    </div>
  );
}
