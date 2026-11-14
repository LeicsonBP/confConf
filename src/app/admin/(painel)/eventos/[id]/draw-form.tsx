"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import type { EventFormState } from "../types";

const initialState: EventFormState = {};

interface DrawFormProps {
  action: (previous: EventFormState, formData: FormData) => Promise<EventFormState>;
  eventId: string;
  total: number;
}

export function DrawForm({ action, eventId, total }: DrawFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="eventId" value={eventId} />
      <p className="text-sm text-ink-soft">
        O sorteio é <strong>único</strong> e não pode ser desfeito. Com {total} participante(s), o
        sistema garante que ninguém tire a si mesmo.
      </p>

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-4 py-3 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending || total < 2}>
          {pending ? "Sorteando..." : "Executar sorteio"}
        </Button>
      </div>
    </form>
  );
}
