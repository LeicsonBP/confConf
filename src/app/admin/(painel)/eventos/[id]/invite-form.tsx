"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { DEFAULT_INVITE_DAYS, MAX_INVITE_DAYS, MAX_USES_LIMIT } from "@/modules/invites/domain/invite";
import type { InviteFormState } from "../invite-types";

const initialState: InviteFormState = {};

interface InviteFormProps {
  action: (previous: InviteFormState, formData: FormData) => Promise<InviteFormState>;
  eventId: string;
}

export function InviteForm({ action, eventId }: InviteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="eventId" value={eventId} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <Field
            label="Nome do convite (opcional)"
            htmlFor="label"
            hint="Ajuda a identificar o link na lista, ex.: “Grupo da família”."
          >
            <input
              id="label"
              name="label"
              type="text"
              maxLength={80}
              className={inputClassName}
              placeholder="Grupo da família"
            />
          </Field>
        </div>

        <Field label="Validade (dias)" htmlFor="days" required>
          <input
            id="days"
            name="days"
            type="number"
            min={1}
            max={MAX_INVITE_DAYS}
            defaultValue={DEFAULT_INVITE_DAYS}
            required
            className={inputClassName}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Limite de usos"
            htmlFor="maxUses"
            hint={`Deixe vazio para ilimitado (até ${MAX_USES_LIMIT} quando preenchido).`}
          >
            <input
              id="maxUses"
              name="maxUses"
              type="number"
              min={1}
              max={MAX_USES_LIMIT}
              className={inputClassName}
              placeholder="Ilimitado"
            />
          </Field>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-3 py-2 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p role="status" className="border-2 border-bottle px-3 py-2 text-sm text-bottle">
          Link gerado — ele aparece na lista abaixo e pode ser copiado quantas vezes quiser.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Gerando..." : "Gerar link de convite"}
        </Button>
      </div>
    </form>
  );
}
