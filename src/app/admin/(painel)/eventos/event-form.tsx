"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { PerforatedDivider } from "@/design-system/ticket";
import type { EventFormState, EventFormValues } from "./types";

const initialState: EventFormState = {};

interface EventFormProps {
  action: (previous: EventFormState, formData: FormData) => Promise<EventFormState>;
  initial?: EventFormValues;
  eventId?: string;
  submitLabel: string;
}

const emptyValues: EventFormValues = {
  name: "",
  description: "",
  location: "",
  startsAt: "",
  maxGift: "",
  extraInfo: "",
  hasSecretSanta: true,
};

export function EventForm({ action, initial = emptyValues, eventId, submitLabel }: EventFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldError = (key: keyof EventFormValues) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Nome da confraternização" htmlFor="name" required error={fieldError("name")}>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={initial.name}
              className={inputClassName}
              placeholder="Confraternização da família"
              aria-invalid={fieldError("name") ? true : undefined}
            />
          </Field>
        </div>

        <Field
          label="Data e horário"
          htmlFor="startsAt"
          hint="Horário de Brasília (America/Sao_Paulo)."
          required
          error={fieldError("startsAt")}
        >
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={initial.startsAt}
            className={inputClassName}
            aria-invalid={fieldError("startsAt") ? true : undefined}
          />
        </Field>

        <Field label="Local" htmlFor="location" error={fieldError("location")}>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={initial.location}
            className={inputClassName}
            placeholder="Salão de festas"
          />
        </Field>

        <Field
          label="Valor máximo do presente (R$)"
          htmlFor="maxGift"
          hint="Opcional. Apenas orienta a lista de desejos."
          error={fieldError("maxGift")}
        >
          <input
            id="maxGift"
            name="maxGift"
            type="text"
            inputMode="decimal"
            defaultValue={initial.maxGift}
            className={inputClassName}
            placeholder="150,00"
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span
            aria-hidden="true"
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft"
          >
            &nbsp;
          </span>
          <label className="flex h-12 items-center gap-3 border-2 border-ink bg-paper px-3">
            <input
              type="checkbox"
              name="hasSecretSanta"
              defaultChecked={initial.hasSecretSanta}
              className="h-5 w-5 accent-[var(--stamp)]"
            />
            <span className="text-sm">Terá amigo secreto</span>
          </label>
        </div>

        <div className="sm:col-span-2">
          <Field
            label="Descrição da confraternização"
            htmlFor="description"
            error={fieldError("description")}
          >
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={initial.description}
              className={inputClassName}
              placeholder="O que vai rolar na festa"
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field
            label="Informações adicionais"
            htmlFor="extraInfo"
            hint="Traje, estacionamento, o que levar…"
            error={fieldError("extraInfo")}
          >
            <textarea
              id="extraInfo"
              name="extraInfo"
              rows={3}
              defaultValue={initial.extraInfo}
              className={inputClassName}
            />
          </Field>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-3 py-2 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      <PerforatedDivider />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
