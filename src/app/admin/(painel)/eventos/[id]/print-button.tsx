"use client";

import { Button } from "@/design-system/button";

export function PrintButton() {
  return (
    <Button type="button" variant="ghost" onClick={() => window.print()} className="print:hidden">
      Imprimir
    </Button>
  );
}
