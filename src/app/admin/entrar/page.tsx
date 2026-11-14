import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TicketCard } from "@/design-system/ticket";
import { createCaptcha } from "@/modules/auth/server/captcha";
import { getAdminSession } from "@/modules/auth/server/session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar · Administração",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const { question, token } = createCaptcha();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-6 py-8 sm:py-12">
      <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-faint">
        ← confConf
      </Link>

      <TicketCard className="p-8 sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">
          Área do administrador
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none">Entrar no painel</h1>
        <p className="mt-3 text-sm text-ink-soft">Tá fazendo o que aqui? Eu hein.</p>
        <div className="mt-8">
          <LoginForm question={question} token={token} />
        </div>
      </TicketCard>
    </main>
  );
}
