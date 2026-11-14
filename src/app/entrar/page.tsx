import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TicketCard } from "@/design-system/ticket";
import { createCaptcha } from "@/modules/auth/server/captcha";
import { getParticipantSession } from "@/modules/auth/server/participant-session";
import { ParticipantLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default async function ParticipantLoginPage() {
  const session = await getParticipantSession();
  if (session) redirect("/app");

  const { question, token } = createCaptcha();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-2 px-6 py-2">
      <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-faint">
        ← confConf
      </Link>

      <TicketCard className="p-4 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">
          Área do participante
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none">Entrar</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Use o usuário que você recebeu no cadastro e a senha que você definiu.
        </p>

        <div className="mt-6">
          <ParticipantLoginForm question={question} token={token} />
        </div>

        <p className="mt-6 text-sm text-ink-soft">
          Esqueceu o acesso?{" "}
          <Link href="/recuperar" className="underline decoration-2 underline-offset-4">
            Recuperar senha
          </Link>{" "}
          ou{" "}
          <Link href="/recuperar/usuario" className="underline decoration-2 underline-offset-4">
            recuperar usuário
          </Link>
          .
        </p>
      </TicketCard>
    </main>
  );
}
