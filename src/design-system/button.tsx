import type * as React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "terracotta";

const VARIANTS: Record<Variant, string> = {
  primary: "border-ink bg-ink text-paper hover:bg-stamp hover:border-stamp",
  secondary: "border-ink bg-paper-2 text-ink hover:bg-paper-3",
  danger: "border-stamp bg-stamp text-paper hover:bg-ink hover:border-ink",
  ghost: "border-transparent bg-transparent text-ink hover:border-ink",
  outline: "border-ink bg-transparent text-ink hover:bg-paper-3",
  terracotta: "border-stamp bg-stamp text-paper hover:bg-ink hover:border-ink",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 border-2 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "secondary",
  className = "",
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return (
    <a
      className={`inline-flex items-center justify-center gap-2 border-2 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
