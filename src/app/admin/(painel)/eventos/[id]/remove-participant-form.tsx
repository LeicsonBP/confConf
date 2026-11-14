"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import type { EventFormState } from "../types";

const initialState: EventFormState = {};

interface RemoveParticipantFormProps {
  action: (previous: EventFormState, formData: FormData) => Promise<EventFormState>;
  eventId: string;
  participantId: string;
}

export function RemoveParticipantForm({
  action,
  eventId,
  participantId,
}: RemoveParticipantFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="participantId" value={participantId} />
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Removendo..." : "Remover"}
      </Button>
      {state.error ? (
        <span role="alert" className="text-right text-xs text-stamp">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
