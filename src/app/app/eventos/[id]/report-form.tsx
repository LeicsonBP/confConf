"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { REPORT_CATEGORIES } from "@/modules/reports/domain/report";
import type { ParticipantActionState } from "./types";

const initialState: ParticipantActionState = {};

interface ReportFormProps {
  eventId: string;
  action: (previous: ParticipantActionState, formData: FormData) => Promise<ParticipantActionState>;
}

export function ReportForm({ eventId, action }: ReportFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="eventId" value={eventId} />

      <Field label="O que aconteceu?" htmlFor="category" required>
        <select id="category" name="category" required className={inputClassName}>
          {REPORT_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Detalhes"
        htmlFor="message"
        hint="Não cite nomes de outras pessoas no texto."
        required
      >
        <textarea
          id="message"
          name="message"
          rows={4}
          minLength={10}
          maxLength={2000}
          required
          className={inputClassName}
        />
      </Field>

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-4 py-3 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p role="status" className="border-2 border-bottle px-4 py-3 text-sm text-bottle">
          Relato enviado. Quem organiza vai ver.
        </p>
      ) : null}

      <div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Enviando..." : "Enviar relato"}
        </Button>
      </div>
    </form>
  );
}
