"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { PerforatedDivider } from "@/design-system/ticket";
import { signUpWithInvite } from "./actions";
import type { SignupState } from "./types";

const initialState: SignupState = {};

interface SignupFormProps {
  tokenHash: string;
  question: string;
  captchaToken: string;
}

const RESTRICTIONS = [
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "sem_lactose", label: "Sem lactose" },
  { value: "sem_gluten", label: "Sem glúten" },
  { value: "outra", label: "Outra restrição" },
];

export function SignupForm({ tokenHash, question, captchaToken }: SignupFormProps) {
  const [state, formAction, pending] = useActionState(signUpWithInvite, initialState);

  if (state.success && state.credentials) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-stamp">
          Ingresso emitido
        </p>
        <h2 className="font-display text-3xl leading-none">Guarde sua cartela</h2>
        <p className="text-sm text-ink-soft">
          Você está participando de <strong>{state.credentials.eventName}</strong>. Estas são as
          credenciais de acesso à sua área — elas não aparecem de novo.
        </p>

        <div className="mt-2 border-2 border-dashed border-ink bg-paper p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
            Credenciais
          </p>
          <dl className="mt-3 grid gap-3">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Identificador
              </dt>
              <dd className="font-mono text-lg">{state.credentials.username}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                PIN
              </dt>
              <dd className="font-mono text-lg">{state.credentials.pin}</dd>
            </div>
          </dl>
        </div>

        <PerforatedDivider />

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => window.print()}>
            Imprimir cartela
          </Button>
        </div>
        <p className="text-xs text-ink-faint">
          Dica: guarde em um lugar seguro ou imprima. Sem essas duas informações não é possível
          entrar na sua área.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="tokenHash" value={tokenHash} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Nome completo" htmlFor="fullName" required>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              className={inputClassName}
              placeholder="Maria Silva"
            />
          </Field>
        </div>

        <Field
          label="Data de nascimento"
          htmlFor="birthDate"
          hint="Usada para confirmar sua identidade se precisar recuperar o acesso."
          required
        >
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            required
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            className={inputClassName}
          />
        </Field>

        <Field label="PIN (4 a 8 dígitos)" htmlFor="pin" required>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{4,8}"
            autoComplete="new-password"
            required
            className={inputClassName}
            placeholder="••••"
          />
        </Field>

        <Field label="Confirme o PIN" htmlFor="pinConfirm" required>
          <input
            id="pinConfirm"
            name="pinConfirm"
            type="password"
            inputMode="numeric"
            pattern="\d{4,8}"
            autoComplete="new-password"
            required
            className={inputClassName}
            placeholder="••••"
          />
        </Field>

        <div className="sm:col-span-2">
          <fieldset className="border-2 border-ink bg-paper p-4">
            <legend className="px-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
              Restrições alimentares
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {RESTRICTIONS.map((restriction) => (
                <label key={restriction.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="restrictions"
                    value={restriction.value}
                    className="h-4 w-4 accent-[var(--stamp)]"
                  />
                  {restriction.label}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <Field label="Detalhe a restrição (opcional)" htmlFor="other">
                <input
                  id="other"
                  name="other"
                  type="text"
                  maxLength={300}
                  className={inputClassName}
                  placeholder="Ex.: alergia a camarão"
                />
              </Field>
            </div>
          </fieldset>
        </div>

        <div className="sm:col-span-2">
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
        </div>
      </div>

      <input type="hidden" name="captchaToken" value={captchaToken} />

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-3 py-2 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Confirmando..." : "Confirmar participação"}
        </Button>
      </div>
    </form>
  );
}
