"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "./button";
import { IconClose, IconMenu } from "./icons";

interface HeaderNavProps {
  profileHref?: string;
  homeHref?: string;
  signOut: () => Promise<void>;
}

const linkClass =
  "inline-flex items-center gap-2 border-2 border-ink bg-transparent px-4 py-2.5 font-mono text-[11px] leading-4 uppercase tracking-[0.15em] text-ink transition-colors hover:bg-paper-3";

export function HeaderNav({ profileHref, homeHref, signOut }: HeaderNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const accountLink = profileHref
    ? pathname === "/app/perfil" && homeHref
      ? { href: homeHref, label: "Início" }
      : { href: profileHref, label: "Meu perfil" }
    : null;

  return (
    <>
      <nav className="hidden items-center gap-2 sm:flex" aria-label="Conta">
        {accountLink ? (
          <Link href={accountLink.href} className={linkClass}>
            {accountLink.label}
          </Link>
        ) : null}
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            className="px-4 py-2.5 text-[11px] leading-4"
          >
            Sair
          </Button>
        </form>
      </nav>

      <div className="relative sm:hidden">
        <button
          type="button"
          aria-label={open ? "Fechar menu da conta" : "Abrir menu da conta"}
          aria-expanded={open}
          aria-controls="menu-conta"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center border-2 border-ink bg-transparent text-ink"
        >
          {open ? <IconClose size={20} /> : <IconMenu size={20} />}
        </button>

        {open ? (
          <div
            id="menu-conta"
            className="absolute right-0 z-50 mt-2 flex w-56 flex-col gap-2 border-2 border-ink bg-paper p-3 shadow-[var(--shadow-stamp)]"
          >
            {accountLink ? (
              <Link href={accountLink.href} className={linkClass} onClick={() => setOpen(false)}>
                {accountLink.label}
              </Link>
            ) : null}
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                className="w-full justify-start px-4 py-2.5 text-[11px] leading-4"
              >
                Sair
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </>
  );
}
