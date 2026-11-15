import type { Metadata } from "next";
import { PerforatedDivider, TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meu perfil",
  robots: { index: false, follow: false },
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export default async function ProfilePage() {
  const session = await requireParticipant();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,username,birth_date")
    .eq("id", session.userId)
    .maybeSingle();

  const { data: participant } = await supabase
    .from("event_participants")
    .select("dietary_restrictions")
    .eq("user_id", session.userId)
    .is("removed_at", null)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">Minha conta</p>
        <h1 className="mt-2 font-display text-4xl leading-none">Meu perfil</h1>
      </div>

      <TicketCard className="p-6 sm:p-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
          Dados de acesso
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Nome completo
            </dt>
            <dd className="mt-1 text-base">{profile?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">Usuário</dt>
            <dd className="mt-1 font-mono text-base break-all">{profile?.username ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Data de nascimento
            </dt>
            <dd className="mt-1 text-base">{formatDate(profile?.birth_date)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ink-faint">
          Nome, usuário e data de nascimento não podem ser alterados. A senha é redefinida pela
          recuperação de acesso.
        </p>
      </TicketCard>

      <TicketCard className="p-6 sm:p-8">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-soft">
          Meus dados
        </h2>
        <PerforatedDivider className="my-8" />
        <ProfileForm restrictions={participant?.dietary_restrictions ?? []} />
      </TicketCard>
    </div>
  );
}
