import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/design-system/button";
import { requireParticipant } from "@/modules/auth/server/participant-session";
import { signOutParticipant } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minha área",
  robots: { index: false, follow: false },
};

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireParticipant();

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-ink bg-paper-2">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <Link href="/app" className="font-display text-2xl leading-none">
              confConf
            </Link>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              {session.fullName} · {session.username}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/app/perfil"
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft underline-offset-4 hover:underline"
            >
              Meu perfil
            </Link>
            <form action={signOutParticipant}>
              <Button type="submit" variant="ghost">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}
