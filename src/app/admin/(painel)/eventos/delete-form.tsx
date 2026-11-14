"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import type { EventFormState } from "./types";

const initialState: EventFormState = {};

interface DeleteEventFormProps {
  action: (previous: EventFormState, formData: FormData) => Promise<EventFormState>;
  eventId: string;
  eventName: string;
}

export function DeleteEventForm({ action, eventId, eventName }: DeleteEventFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="eventId" value={eventId} />

      <Field
        label={`Digite "${eventName}" para confirmar`}
        htmlFor="confirmation"
        hint="A exclusão remove participantes, convites, listas e relatos deste evento."
        required
      >
        <input
          id="confirmation"
          name="confirmation"
          type="text"
          required
          autoComplete="off"
          className={inputClassName}
        />
      </Field>

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-3 py-2 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Excluindo..." : "Excluir evento"}
      </Button>
    </form>
  );
}
