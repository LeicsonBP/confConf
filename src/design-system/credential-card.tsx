"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/design-system/button";
import { formatEventDate } from "@/modules/events/domain/event";

export interface CredentialData {
  username: string;
  pin: string;
  eventName: string;
  eventDate: string;
  eventAddress: string | null;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) context.fillText(line, x, currentY);
  return currentY;
}

interface CredentialCardProps extends CredentialData {
  heading?: string;
  subtitle?: string;
  intro?: string;
}

export function CredentialCard({
  heading = "Cadastro concluído",
  subtitle = "Tudo certo!",
  intro = "Você já está participando. Estes são seus dados de acesso:",
  username,
  pin,
  eventName,
  eventDate,
  eventAddress,
}: CredentialCardProps) {
  const [saved, setSaved] = useState(false);

  function saveImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#f4ecdc";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#1b1814";
    context.lineWidth = 10;
    context.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

    context.fillStyle = "#b5372a";
    context.font = "600 30px monospace";
    context.fillText("CONFCONF", 100, 160);

    context.fillStyle = "#1b1814";
    context.font = "700 58px Georgia, serif";
    context.fillText("Cadastro concluído", 100, 260);

    context.font = "700 40px Georgia, serif";
    const afterName = drawWrappedText(context, eventName, 100, 350, 880, 50);

    context.font = "24px monospace";
    context.fillStyle = "#4a4237";
    context.fillText(formatEventDate(eventDate), 100, afterName + 50);
    if (eventAddress) {
      context.fillText(eventAddress, 100, afterName + 90);
    }

    context.strokeStyle = "#8a7d69";
    context.lineWidth = 3;
    context.setLineDash([12, 10]);
    context.beginPath();
    context.moveTo(100, 620);
    context.lineTo(980, 620);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "#4a4237";
    context.font = "600 26px monospace";
    context.fillText("USUÁRIO", 100, 710);
    context.fillStyle = "#1b1814";
    context.font = "700 54px monospace";
    context.fillText(username, 100, 780);

    context.fillStyle = "#4a4237";
    context.font = "600 26px monospace";
    context.fillText("SENHA", 100, 890);
    context.fillStyle = "#1b1814";
    context.font = "700 54px monospace";
    context.fillText(pin, 100, 960);

    context.fillStyle = "#8a7d69";
    context.font = "22px monospace";
    drawWrappedText(
      context,
      "Guarde esta imagem: ela tem os dados de acesso à sua área no confConf.",
      100,
      1180,
      880,
      32,
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `confconf-${username}.png`;
      link.click();
      URL.revokeObjectURL(url);
      setSaved(true);
    }, "image/png");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-bottle">{heading}</p>
        <h2 className="mt-2 font-display text-3xl leading-none">{subtitle}</h2>
        <p className="mt-3 text-sm text-ink-soft">{intro}</p>
      </div>

      <div className="border-2 border-ink bg-paper p-6">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Usuário
            </dt>
            <dd className="mt-1 font-mono text-xl break-all">{username}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Senha
            </dt>
            <dd className="mt-1 font-mono text-xl">{pin}</dd>
          </div>
        </dl>

        {eventName ? (
          <div className="mt-6 border-t-2 border-dashed border-ink-faint pt-5">
            <p className="font-display text-lg leading-tight">{eventName}</p>
            {eventDate ? (
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft">
                {formatEventDate(eventDate)}
              </p>
            ) : null}
            {eventAddress ? <p className="mt-1 text-sm text-ink-soft">{eventAddress}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/app"
          className="inline-flex items-center justify-center border-2 border-ink bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-paper transition-colors hover:border-stamp hover:bg-stamp"
        >
          Acessar minha área
        </Link>
        <Button type="button" variant="secondary" onClick={saveImage}>
          Baixar informações de acesso
        </Button>
        {saved ? (
          <span role="status" className="text-sm text-bottle">
            Arquivo salvo!
          </span>
        ) : null}
      </div>

      <p className="text-xs text-ink-faint">
        Guarde o arquivo: é com esse usuário e senha que você entra na sua área. Se perder, ainda dá
        para recuperar o acesso com seu usuário e data de nascimento.
      </p>
    </div>
  );
}
