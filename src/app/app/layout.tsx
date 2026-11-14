import type { Metadata } from "next";
import Link from "next/link";
import { HeaderNav } from "@/design-system/header-nav";
import { IconUser } from "@/design-system/icons";
import { Stamp } from "@/design-system/ticket";
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
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/app" className="font-display text-2xl leading-none">
                confConf
              </Link>
              <Stamp tone="stamp">
                <span className="inline-flex items-center gap-1.5">
                  <IconUser size={12} />
                  Área do participante
                </span>
              </Stamp>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              {session.fullName} · {session.username}
            </p>
          </div>

          <div className="ml-auto">
            <HeaderNav profileHref="/app/perfil" signOut={signOutParticipant} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}
