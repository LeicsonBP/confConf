"use client";

import { useActionState, useState } from "react";
import { Button } from "@/design-system/button";
import type { EventFormState } from "../types";

const initialState: EventFormState = {};

interface CancelDrawFormProps {
  action: (previous: EventFormState, formData: FormData) => Promise<EventFormState>;
  eventId: string;
}

export function CancelDrawForm({ action, eventId }: CancelDrawFormProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!confirming) {
    return (
      <div className="flex flex-col gap-2">
        <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
          Desfazer sorteio
        </Button>
        <p className="text-xs text-ink-faint">
          Reabre o elenco para incluir ou remover participantes e permite sortear de novo.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <p className="text-sm text-stamp">
        Desfazer apaga todos os pares e as confirmações. Os participantes poderão ser sorteados
        novamente.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "Desfazendo..." : "Confirmar e desfazer"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-stamp">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
