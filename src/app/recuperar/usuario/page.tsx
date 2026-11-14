import type { Metadata } from "next";
import Link from "next/link";
import { TicketCard } from "@/design-system/ticket";
import { createCaptcha } from "@/modules/auth/server/captcha";
import { RecoverUsernameForm } from "./recover-username-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recuperar usuário",
  robots: { index: false, follow: false },
};

export default function RecoverUsernamePage() {
  const { question, token } = createCaptcha();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-6 py-8 sm:py-12">
      <Link href="/entrar" className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-faint">
        ← Entrar
      </Link>

      <TicketCard className="p-8 sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">
          Recuperar acesso
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none">Esqueci meu usuário</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Se você lembra a senha, informe junto com a data de nascimento para ver seu usuário.
        </p>

        <div className="mt-8">
          <RecoverUsernameForm question={question} token={token} />
        </div>
      </TicketCard>
    </main>
  );
}
