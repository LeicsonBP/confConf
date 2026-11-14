export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <section className="border-2 border-ink bg-paper-2 p-8 shadow-[var(--shadow-stamp)] sm:p-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-soft">
          Confraternizações &amp; amigo secreto
        </p>
        <h1 className="mt-6 font-display text-5xl leading-none sm:text-6xl">confConf</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Ingressos de convite, sorteio sem auto-sorteio e lista de desejos — tudo enfeitado como
          uma festa de antigamente, mas com privacidade garantida no banco de dados.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-wider">
          <span className="border-2 border-ink px-3 py-2">Convite por link</span>
          <span className="border-2 border-ink px-3 py-2">Sorteio em segredo</span>
          <span className="border-2 border-ink px-3 py-2">Lista de desejos</span>
        </div>
      </section>

      <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
        Em construção — acompanhe o plano em implementation_plan.md
      </p>
    </main>
  );
}
