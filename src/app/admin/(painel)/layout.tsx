import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/design-system/button";
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
      <header className="border-b-2 border-ink bg-paper-2">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-display text-2xl leading-none">
              confConf
            </Link>
            <Stamp tone="stamp">Área do administrador</Stamp>
          </div>

          <form action={signOutAdmin}>
            <Button type="submit" variant="ghost">
              Sair
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
