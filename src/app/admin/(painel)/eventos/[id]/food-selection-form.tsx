"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import { FOOD_RULES } from "@/modules/food-planning/rules";
import type { EventFormState } from "../types";

const initialState: EventFormState = {};

interface FoodSelectionFormProps {
  action: (previous: EventFormState, formData: FormData) => Promise<EventFormState>;
  eventId: string;
  selected: string[];
}

export function FoodSelectionForm({ action, eventId, selected }: FoodSelectionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="eventId" value={eventId} />

      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          O que será comprado?
        </legend>
        <p className="mt-1 text-xs text-ink-faint">
          Marque os itens e clique em Calcular. As estimativas consideram apenas o que estiver
          marcado.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FOOD_RULES.map((rule) => (
            <label
              key={rule.key}
              className="flex h-12 items-center gap-2 border-2 border-ink bg-paper px-3 text-sm"
            >
              <input
                type="checkbox"
                name="foodSelection"
                value={rule.key}
                defaultChecked={selected.includes(rule.key)}
                className="h-5 w-5 accent-[var(--stamp)]"
              />
              {rule.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Calculando..." : "Calcular"}
        </Button>
        {state.success ? (
          <span role="status" className="text-sm text-bottle">
            Cálculo atualizado.
          </span>
        ) : null}
        {state.error ? (
          <span role="alert" className="text-sm text-stamp">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
