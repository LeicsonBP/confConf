"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";

interface RecoveryFormProps {
  questionOne: string;
  tokenOne: string;
  questionTwo: string;
  tokenTwo: string;
}

type Step = 1 | 2 | 3;

export function RecoveryForm({ questionOne, tokenOne, questionTwo, tokenTwo }: RecoveryFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleIdentify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/recuperacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.get("username"),
          birthDate: data.get("birthDate"),
          captchaAnswer: data.get("captchaAnswer"),
          captchaToken: tokenOne,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Não foi possível confirmar os dados.");
        return;
      }
      setStep(2);
    } catch {
      setError("Não foi possível continuar agora. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/recuperacao/senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: data.get("pin"),
          pinConfirm: data.get("pinConfirm"),
          captchaAnswer: data.get("captchaAnswer"),
          captchaToken: tokenTwo,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Não foi possível alterar a senha.");
        return;
      }
      setStep(3);
    } catch {
      setError("Não foi possível alterar a senha agora.");
    } finally {
      setPending(false);
    }
  }

  if (step === 3) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-bottle">
          Senha alterada
        </p>
        <h2 className="font-display text-3xl leading-none">Tudo certo</h2>
        <p className="text-sm text-ink-soft">
          Você já pode entrar com o seu usuário e a nova senha.
        </p>
        <div>
          <Link
            href="/entrar"
            className="inline-flex items-center justify-center border-2 border-ink bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-paper"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <form onSubmit={handleReset} className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-2xl leading-none">Defina a nova senha</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Senha numérica de 4 a 8 dígitos. Todas as sessões antigas serão encerradas.
          </p>
        </div>

        <Field label="Nova senha" htmlFor="pin" required>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{4,8}"
            required
            className={inputClassName}
            placeholder="••••"
          />
        </Field>

        <Field label="Confirme a nova senha" htmlFor="pinConfirm" required>
          <input
            id="pinConfirm"
            name="pinConfirm"
            type="password"
            inputMode="numeric"
            pattern="\d{4,8}"
            required
            className={inputClassName}
            placeholder="••••"
          />
        </Field>

        <Field label={questionTwo} htmlFor="captchaTwo" required>
          <input
            id="captchaTwo"
            name="captchaAnswer"
            type="text"
            inputMode="numeric"
            pattern="-?[0-9]*"
            required
            className={`${inputClassName} max-w-[9rem]`}
          />
        </Field>

        {error ? (
          <p role="alert" className="border-2 border-stamp px-4 py-3 text-sm text-stamp">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Alterando..." : "Alterar senha"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleIdentify} className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl leading-none">Confirme seus dados</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Informe seu usuário e sua data de nascimento para redefinir a senha.
        </p>
      </div>

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

      <Field label="Data de nascimento" htmlFor="birthDate" required>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          min="1900-01-01"
          required
          className={inputClassName}
        />
      </Field>

      <Field label={questionOne} htmlFor="captchaOne" required>
        <input
          id="captchaOne"
          name="captchaAnswer"
          type="text"
          inputMode="numeric"
          pattern="-?[0-9]*"
          required
          className={`${inputClassName} max-w-[9rem]`}
        />
      </Field>

      {error ? (
        <p role="alert" className="border-2 border-stamp px-4 py-3 text-sm text-stamp">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Verificando..." : "Continuar"}
      </Button>
    </form>
  );
}
