import type { Metadata } from "next";
import { PerforatedDivider, TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import { sha256Hex } from "@/lib/crypto";
import { createCaptcha } from "@/modules/auth/server/captcha";
import { formatCentsToBrl, formatEventDate } from "@/modules/events/domain/event";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Convite",
  robots: { index: false, follow: false },
};

interface InvitePreview {
  valid?: boolean;
  reason?: string;
  event?: {
    name?: string;
    description?: string | null;
    location?: string | null;
    address?: string | null;
    starts_at?: string;
    max_gift_cents?: number | null;
    has_secret_santa?: boolean;
  };
}

const REASON_TEXT: Record<string, string> = {
  not_found: "Este convite não existe. Confira o link com quem organiza.",
  revoked: "Este convite foi revogado por quem organiza.",
  expired: "Este convite expirou. Peça um novo link a quem organiza.",
  exhausted: "Este convite atingiu o limite de usos.",
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenHash = sha256Hex(token);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_preview", { p_token_hash: tokenHash });
  const preview = data as InvitePreview | null;

  if (error || !preview?.valid || !preview.event) {
    const message = REASON_TEXT[preview?.reason ?? "not_found"] ?? REASON_TEXT.not_found;

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-6 px-6 py-16">
        <TicketCard className="p-8 text-center sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">Convite</p>
          <h1 className="mt-3 font-display text-3xl leading-none">Ingresso inválido</h1>
          <p className="mt-4 text-sm text-ink-soft">{message}</p>
        </TicketCard>
      </main>
    );
  }

  const event = preview.event;
  const { question, token: captchaToken } = createCaptcha();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <TicketCard className="p-8 sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">
          Você foi convidado
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none">
          {event.name ?? "Confraternização"}
        </h1>

        <p className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
          {event.starts_at ? formatEventDate(event.starts_at) : ""}
        </p>

        {event.location ? (
          <p className="mt-2 text-sm text-ink-soft">
            <span className="font-medium">Local:</span> {event.location}
          </p>
        ) : null}
        {event.address ? (
          <p className="mt-1 text-sm text-ink-soft">
            <span className="font-medium">Endereço:</span> {event.address}
          </p>
        ) : null}

        {event.description ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{event.description}</p>
        ) : null}

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          {event.has_secret_santa ? "Com amigo secreto" : "Sem amigo secreto"}
          {event.max_gift_cents !== null && event.max_gift_cents !== undefined
            ? ` · Até R$ ${formatCentsToBrl(event.max_gift_cents)}`
            : ""}
        </p>

        <PerforatedDivider className="my-8" />

        <h2 className="font-display text-2xl leading-none">Seus dados</h2>
        <p className="mt-2 text-sm text-ink-soft">
          No fim você recebe seu usuário e senha para acessar a área do participante.
        </p>

        <div className="mt-6">
          <SignupForm tokenHash={tokenHash} question={question} captchaToken={captchaToken} />
        </div>
      </TicketCard>
    </main>
  );
}
