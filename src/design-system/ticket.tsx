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
  size = "sm",
}: {
  children: React.ReactNode;
  tone?: "ink" | "stamp" | "bottle";
  size?: "sm" | "md";
}) {
  const tones = {
    ink: "border-ink text-ink",
    stamp: "border-stamp text-stamp",
    bottle: "border-bottle text-bottle",
  } as const;

  const sizes = {
    sm: "px-2 py-1 text-[10px]",
    md: "px-3 py-1.5 text-[11px]",
  } as const;

  return (
    <span
      className={`inline-flex items-center border-2 font-mono uppercase tracking-[0.2em] ${sizes[size]} ${tones[tone]}`}
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
