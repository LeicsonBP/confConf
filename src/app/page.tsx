import Link from "next/link";
import { IconShield, IconSparkles, IconTicket } from "@/design-system/icons";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-10 sm:py-16">
      <section className="w-full border-2 border-ink bg-paper-2 p-10 text-center shadow-[var(--shadow-stamp)] sm:p-14">
        <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-ink-soft">
          <IconSparkles size={14} />
          Confraternizações &amp; amigo secreto
        </p>
        <h1 className="mt-6 font-display text-6xl leading-none sm:text-8xl">confConf</h1>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin/entrar"
            className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-ink px-8 py-3 text-sm font-medium tracking-wide text-paper transition-colors hover:border-stamp hover:bg-stamp"
          >
            <IconShield size={17} />
            Área do Administrador
          </Link>
          <Link
            href="/entrar"
            className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-transparent px-8 py-3 text-sm font-medium tracking-wide text-ink transition-colors hover:bg-paper-3"
          >
            <IconTicket size={17} />
            Área do Participante
          </Link>
        </div>
      </section>
    </main>
  );
}
