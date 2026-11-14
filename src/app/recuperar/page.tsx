import type { Metadata } from "next";
import Link from "next/link";
import { TicketCard } from "@/design-system/ticket";
import { createCaptcha } from "@/modules/auth/server/captcha";
import { RecoveryForm } from "./recovery-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recuperar acesso",
  robots: { index: false, follow: false },
};

export default function RecoveryPage() {
  const first = createCaptcha();
  const second = createCaptcha();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <Link href="/entrar" className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-faint">
        ← Entrar
      </Link>

      <TicketCard className="p-8 sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">
          Recuperar acesso
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none">Esqueci minha senha</h1>

        <div className="mt-8">
          <RecoveryForm
            questionOne={first.question}
            tokenOne={first.token}
            questionTwo={second.question}
            tokenTwo={second.token}
          />
        </div>

        <p className="mt-8 text-sm text-ink-soft">
          Lembra a senha mas esqueceu o usuário?{" "}
          <Link href="/recuperar/usuario" className="underline decoration-2 underline-offset-4">
            Recuperar usuário
          </Link>
        </p>
      </TicketCard>
    </main>
  );
}
