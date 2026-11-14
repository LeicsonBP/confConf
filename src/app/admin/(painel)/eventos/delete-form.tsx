"use client";

import { useActionState, useState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import type { EventFormState } from "./types";

const initialState: EventFormState = {};

interface DeleteEventFormProps {
  action: (previous: EventFormState, formData: FormData) => Promise<EventFormState>;
  eventId: string;
  question: string;
  token: string;
}

export function DeleteEventForm({ action, eventId, question, token }: DeleteEventFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [confirmation, setConfirmation] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="captchaToken" value={token} />

      <Field
        label='Digite "deletar" para confirmar'
        htmlFor="confirmation"
        hint="A exclusão remove participantes, convites, listas e relatos desta confraternização."
        required
      >
        <input
          id="confirmation"
          name="confirmation"
          type="text"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value.toLowerCase())}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          required
          className={inputClassName}
        />
      </Field>

      <Field
        label={question}
        htmlFor="captchaAnswer"
        hint="Prova rápida de que não é um robô."
        required
      >
        <input
          id="captchaAnswer"
          name="captchaAnswer"
          type="text"
          inputMode="numeric"
          pattern="-?[0-9]*"
          autoComplete="off"
          required
          className={`${inputClassName} max-w-[9rem]`}
        />
      </Field>

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-3 py-2 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Excluindo..." : "Excluir confraternização"}
      </Button>
    </form>
  );
}
