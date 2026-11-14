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
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-ink bg-paper-2 print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
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
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
