"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "./button";
import { IconClose, IconLogout, IconMenu, IconUser } from "./icons";

interface HeaderNavProps {
  profileHref?: string;
  signOut: () => Promise<void>;
}

const linkClass =
  "inline-flex items-center gap-2 border-2 border-ink bg-transparent px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink transition-colors hover:bg-paper-3";

export function HeaderNav({ profileHref, signOut }: HeaderNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-2 sm:flex" aria-label="Conta">
        {profileHref ? (
          <Link href={profileHref} className={linkClass}>
            <IconUser />
            Meu perfil
          </Link>
        ) : null}
        <form action={signOut}>
          <Button type="submit" variant="outline" className="px-4 py-2 text-[11px]">
            <IconLogout />
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
            {profileHref ? (
              <Link href={profileHref} className={linkClass} onClick={() => setOpen(false)}>
                <IconUser />
                Meu perfil
              </Link>
            ) : null}
            <form action={signOut}>
              <Button type="submit" variant="outline" className="w-full justify-start px-4 py-2 text-[11px]">
                <IconLogout />
                Sair
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </>
  );
}
