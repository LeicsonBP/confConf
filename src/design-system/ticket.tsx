import type * as React from "react";

export function TicketCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-2 border-ink bg-paper-2 shadow-[var(--shadow-stamp)] ${className}`}>
      {children}
    </section>
  );
}

export function Stamp({
  children,
  tone = "ink",
}: {
  children: React.ReactNode;
  tone?: "ink" | "stamp" | "bottle";
}) {
  const tones = {
    ink: "border-ink text-ink",
    stamp: "border-stamp text-stamp",
    bottle: "border-bottle text-bottle",
  } as const;

  return (
    <span
      className={`inline-flex items-center border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function PerforatedDivider({ className = "my-6" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`border-t-2 border-dashed border-ink-faint ${className}`} />
  );
}
