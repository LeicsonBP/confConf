"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import type { ParticipantActionState } from "./types";

const initialState: ParticipantActionState = {};

interface ConfirmDrawFormProps {
  eventId: string;
  action: (previous: ParticipantActionState, formData: FormData) => Promise<ParticipantActionState>;
}

export function ConfirmDrawForm({ eventId, action }: ConfirmDrawFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Confirmando..." : "Confirmar que vi meu amigo secreto"}
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
