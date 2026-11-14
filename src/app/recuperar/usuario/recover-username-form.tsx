"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { CredentialCard } from "@/design-system/credential-card";

interface RecoveredData {
  username: string;
  password: string;
  event: { name: string; startsAt: string; address: string | null } | null;
}

export function RecoverUsernameForm({
  question,
  token,
}: {
  question: string;
  token: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<RecoveredData | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/recuperacao/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: data.get("password"),
          birthDate: data.get("birthDate"),
          captchaAnswer: data.get("captchaAnswer"),
          captchaToken: token,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        username?: string;
        password?: string;
        event?: RecoveredData["event"];
      };

      if (!response.ok || !result.ok || !result.username) {
        setError(result.error ?? "Não encontramos um cadastro com esses dados.");
        return;
      }

      setRecovered({
        username: result.username,
        password: result.password ?? "",
        event: result.event ?? null,
      });
    } catch {
      setError("Não foi possível continuar agora. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  if (recovered) {
    return (
      <CredentialCard
        username={recovered.username}
        pin={recovered.password}
        eventName={recovered.event?.name ?? ""}
        eventDate={recovered.event?.startsAt ?? ""}
        eventAddress={recovered.event?.address ?? null}
        heading="Acesso recuperado"
        subtitle="Boas-vindas de volta"
        intro="Estes são seus dados de acesso. Aproveite para baixar e guardar de novo:"
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl leading-none">Informe sua senha e nascimento</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Com a senha que você cadastrou e sua data de nascimento, mostramos seu usuário de acesso.
        </p>
      </div>

      <Field label="Senha" htmlFor="password" required>
        <input
          id="password"
          name="password"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          className={inputClassName}
          placeholder="••••"
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

      <Field label={question} htmlFor="captchaAnswer" required>
        <input
          id="captchaAnswer"
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
        {pending ? "Procurando..." : "Recuperar meu usuário"}
      </Button>
    </form>
  );
}
