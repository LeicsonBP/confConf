import type { Metadata } from "next";
import { TicketCard } from "@/design-system/ticket";
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
        <TicketCard className="p-8 text-center">
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

        <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
          {event.starts_at ? formatEventDate(event.starts_at) : ""}
          {event.location ? ` · ${event.location}` : ""}
        </p>

        {event.description ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{event.description}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          {event.has_secret_santa ? <span>Com amigo secreto</span> : <span>Sem amigo secreto</span>}
          {event.max_gift_cents !== null && event.max_gift_cents !== undefined ? (
            <span>· Até R$ {formatCentsToBrl(event.max_gift_cents)}</span>
          ) : null}
        </div>

        <div className="mt-8">
          <h2 className="font-display text-2xl leading-none">Preencha seu cadastro</h2>
          <p className="mt-2 text-sm text-ink-soft">
            No fim você recebe seu identificador e PIN — guarde a cartela.
          </p>
          <div className="mt-5">
            <SignupForm tokenHash={tokenHash} question={question} captchaToken={captchaToken} />
          </div>
        </div>
      </TicketCard>
    </main>
  );
}
