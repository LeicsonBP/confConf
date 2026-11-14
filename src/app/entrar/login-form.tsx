"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { signInParticipant } from "./actions";
import type { ParticipantLoginState } from "./types";

const initialState: ParticipantLoginState = {};

export function ParticipantLoginForm({
  question,
  token,
}: {
  question: string;
  token: string;
}) {
  const [state, formAction, pending] = useActionState(signInParticipant, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-5">
        <Field label="Usuário" htmlFor="username" required>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            className={inputClassName}
          />
        </Field>

        <Field label="Senha" htmlFor="password" hint="A senha numérica que você recebeu no cadastro." required>
          <input
            id="password"
            name="password"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            required
            className={inputClassName}
          />
        </Field>

        <Field label={question} htmlFor="captchaAnswer" hint="Prova rápida de que não é um robô." required>
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

      <input type="hidden" name="captchaToken" value={token} />

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-4 py-3 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
