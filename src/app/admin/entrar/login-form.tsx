"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { signInAdmin } from "./actions";
import type { LoginState } from "./types";

const initialState: LoginState = {};

interface LoginFormProps {
  question: string;
  token: string;
}

export function LoginForm({ question, token }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInAdmin, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-5">
        <Field label="Usuário" htmlFor="identifier" required>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            className={inputClassName}
            placeholder="admin"
          />
        </Field>

        <Field label="Senha" htmlFor="password" required>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
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
            autoComplete="off"
            pattern="-?[0-9]*"
            required
            className={`${inputClassName} max-w-[9rem]`}
          />
        </Field>
      </div>

      <input type="hidden" name="captchaToken" value={token} />

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-3 py-2 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Entrando..." : "Entrar no painel"}
      </Button>
    </form>
  );
}
