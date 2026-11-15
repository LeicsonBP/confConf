"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { DIETARY_OPTIONS } from "@/modules/participants/domain/restrictions";
import { CredentialCard } from "@/design-system/credential-card";
import { signUpWithInvite } from "./actions";
import type { SignupState } from "./types";

const initialState: SignupState = {};

interface SignupFormProps {
  tokenHash: string;
  question: string;
  captchaToken: string;
}

export function SignupForm({ tokenHash, question, captchaToken }: SignupFormProps) {
  const [state, formAction, pending] = useActionState(signUpWithInvite, initialState);

  if (state.success && state.credentials) {
    return <CredentialCard {...state.credentials} />;
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl leading-none">Seus dados</h2>
        <p className="mt-2 text-sm text-ink-soft">
          No fim você recebe seu usuário de acesso. A senha é a que você definir aqui.
        </p>
      </div>

      <input type="hidden" name="tokenHash" value={tokenHash} />

      <div className="grid gap-6 sm:grid-cols-2">
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

        <div className="sm:col-span-2">
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
        </div>

        <Field label="Senha (4 a 8 dígitos)" htmlFor="pin" required>
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

        <Field label="Confirme a senha" htmlFor="pinConfirm" required>
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
          <fieldset className="border-2 border-ink bg-paper p-5">
            <legend className="px-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
              Restrições alimentares
            </legend>
            <p className="mt-2 text-xs text-ink-faint">Opcional — marque o que se aplica a você.</p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {DIETARY_OPTIONS.map((restriction) => (
                <label
                  key={restriction.value}
                  className="flex items-center gap-3 px-2 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="restrictions"
                    value={restriction.value}
                    className="h-5 w-5 accent-[var(--stamp)]"
                  />
                  {restriction.label}
                </label>
              ))}
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
        <p role="alert" className="border-2 border-stamp px-4 py-3 text-sm text-stamp">
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
