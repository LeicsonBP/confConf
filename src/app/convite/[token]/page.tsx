import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { PerforatedDivider, TicketCard } from "@/design-system/ticket";
import { createClient } from "@/lib/supabase/server";
import { sha256Hex } from "@/lib/crypto";
import { createCaptcha } from "@/modules/auth/server/captcha";
import { formatCentsToBrl, formatEventDate } from "@/modules/events/domain/event";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

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

const loadPreview = cache(async (token: string): Promise<InvitePreview | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_preview", {
    p_token_hash: sha256Hex(token),
  });
  if (error) return null;
  return (data as InvitePreview | null) ?? null;
});

function shareDescription(preview: InvitePreview | null): string {
  const event = preview?.event;
  const parts = [
    event?.starts_at ? formatEventDate(event.starts_at) : null,
    event?.location ?? null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Você foi convidado para uma confraternização.";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const preview = await loadPreview(token);

  if (!preview?.valid || !preview.event) {
    return {
      title: "Convite indisponível",
      robots: { index: false, follow: false },
    };
  }

  const name = preview.event.name ?? "Confraternização";
  const title = `Cadastre-se para: ${name}`;
  const description = shareDescription(preview);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      images: appUrl
        ? [{ url: `${appUrl}/icon-512.png`, width: 512, height: 512, alt: "confConf" }]
        : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
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
  const preview = await loadPreview(token);

  if (!preview?.valid || !preview.event) {
    const message = REASON_TEXT[preview?.reason ?? "not_found"] ?? REASON_TEXT.not_found;

    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-6 py-4 sm:py-10">
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-4 sm:py-10">
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

        <div className="mt-6">
          <SignupForm tokenHash={tokenHash} question={question} captchaToken={captchaToken} />
        </div>

        <p className="mt-8 text-sm text-ink-soft">
          Já tem cadastro?{" "}
          <Link href="/entrar" className="underline decoration-2 underline-offset-4">
            Entrar na sua área
          </Link>
        </p>
      </TicketCard>
    </main>
  );
}
