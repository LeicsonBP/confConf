import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
      <section className="w-full border-2 border-ink bg-paper-2 p-10 text-center shadow-[var(--shadow-stamp)] sm:p-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-soft">
          Confraternizações &amp; amigo secreto
        </p>
        <h1 className="mt-6 font-display text-6xl leading-none sm:text-8xl">confConf</h1>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin/entrar"
            className="inline-flex items-center justify-center border-2 border-ink bg-ink px-8 py-3 text-sm font-medium tracking-wide text-paper transition-colors hover:border-stamp hover:bg-stamp"
          >
            Área do Administrador
          </Link>
        </div>
      </section>
    </main>
  );
}
