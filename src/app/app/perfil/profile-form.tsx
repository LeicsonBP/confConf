"use client";

import { useActionState, useState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { DIETARY_OPTIONS } from "@/modules/participants/domain/restrictions";
import { updateProfile } from "./actions";
import type { ProfileFormState } from "./types";

const initialState: ProfileFormState = {};

interface ProfileFormProps {
  restrictions: string[];
  other: string;
}

export function ProfileForm({ restrictions, other }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [hasOther, setHasOther] = useState(restrictions.includes("outra"));

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="border-2 border-ink bg-paper p-5">
        <legend className="px-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
          Restrições alimentares
        </legend>
        <p className="mt-2 text-xs text-ink-faint">Opcional — marque o que se aplica a você.</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {DIETARY_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-3 px-2 py-2 text-sm">
              <input
                type="checkbox"
                name="restrictions"
                value={option.value}
                defaultChecked={restrictions.includes(option.value)}
                className="h-5 w-5 accent-[var(--stamp)]"
                onChange={
                  option.value === "outra"
                    ? (event) => setHasOther(event.currentTarget.checked)
                    : undefined
                }
              />
              {option.label}
            </label>
          ))}
        </div>

        {hasOther ? (
          <div className="mt-5">
            <Field label="Qual outra restrição?" htmlFor="other">
              <input
                id="other"
                name="other"
                type="text"
                maxLength={300}
                defaultValue={other}
                className={inputClassName}
                placeholder="Ex.: alergia a camarão"
              />
            </Field>
          </div>
        ) : null}
      </fieldset>

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-4 py-3 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p role="status" className="border-2 border-bottle px-4 py-3 text-sm text-bottle">
          Perfil atualizado.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
