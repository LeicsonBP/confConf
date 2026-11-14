import type { Metadata } from "next";
import Link from "next/link";
import { HeaderNav } from "@/design-system/header-nav";
import { IconShield } from "@/design-system/icons";
import { Stamp } from "@/design-system/ticket";
import { requireAdmin } from "@/modules/auth/server/session";
import { signOutAdmin } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const adminName = (session.email?.split("@")[0] ?? "admin").toUpperCase();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b-2 border-ink bg-paper-2 print:hidden">
        <div className="mx-auto max-w-5xl px-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/admin" className="font-display text-2xl leading-none">
                confConf
              </Link>
              <Stamp tone="stamp">
                <span className="inline-flex items-center gap-1.5">
                  <IconShield size={12} />
                  Área do administrador
                </span>
              </Stamp>
            </div>
            <div className="ml-auto">
              <HeaderNav signOut={signOutAdmin} />
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="mt-3 border-t-2 border-dashed border-ink-faint" />

        <div className="mx-auto max-w-5xl px-6 pb-4 pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            {adminName}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
