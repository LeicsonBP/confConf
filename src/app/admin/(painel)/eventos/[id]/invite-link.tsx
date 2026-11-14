"use client";

import { useState } from "react";
import { Button } from "@/design-system/button";

export function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        className="w-full border-2 border-ink bg-paper px-3 py-2 font-mono text-xs text-ink-soft"
        aria-label="Link do convite"
      />
      <Button type="button" variant="secondary" onClick={copy} className="whitespace-nowrap">
        {copied ? "Copiado!" : "Copiar link"}
      </Button>
    </div>
  );
}
