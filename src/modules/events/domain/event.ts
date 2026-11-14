import { z } from "zod";

/** Fuso padrão de exibição; o Brasil não usa horário de verão desde 2019. */
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";
export const DEFAULT_TIMEZONE_OFFSET = "-03:00";

export const eventInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "O nome precisa ter entre 3 e 120 caracteres.")
    .max(120, "O nome precisa ter entre 3 e 120 caracteres."),
  description: z.string().trim().max(2000, "A descrição aceita no máximo 2000 caracteres."),
  location: z.string().trim().max(200, "O local aceita no máximo 200 caracteres."),
  address: z.string().trim().max(300, "O endereço aceita no máximo 300 caracteres."),
  startsAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe data e horário válidos."),
  drawScheduledAt: z
    .string()
    .trim()
    .regex(
      /^$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      "Informe uma data e horário válidos para o sorteio.",
    ),
  maxGift: z.string().trim(),
  extraInfo: z.string().trim().max(2000, "As informações adicionais aceitam até 2000 caracteres."),
  hasSecretSanta: z.boolean(),
});

export type EventInput = z.infer<typeof eventInputSchema>;

export interface EventRow {
  name: string;
  description: string | null;
  location: string | null;
  address: string | null;
  starts_at: string;
  draw_scheduled_at: string | null;
  timezone: string;
  max_gift_cents: number | null;
  extra_info: string | null;
  has_secret_santa: boolean;
}

const BRL_PATTERN = /^(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?$/;

/**
 * Converte "150", "150,00", "1.234,56" ou "R$ 99,90" em centavos.
 * Retorna `null` quando vazio e lança erro quando inválido.
 */
export function parseBrlToCents(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;

  const match = BRL_PATTERN.exec(value);
  if (!match) throw new Error("Valor inválido. Use o formato 150,00.");

  const reais = Number((match[1] as string).replace(/\./g, ""));
  const centavos = Number((match[2] ?? "0").padEnd(2, "0"));
  return reais * 100 + centavos;
}

export function formatCentsToBrl(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Converte o valor de `<input type="datetime-local">` em ISO com o fuso de São Paulo.
 */
export function toSaoPauloIso(localDateTime: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localDateTime)) {
    throw new Error("Data e horário inválidos.");
  }
  const iso = `${localDateTime}:00${DEFAULT_TIMEZONE_OFFSET}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Data e horário inválidos.");
  }
  return date.toISOString();
}

/** Formata um ISO em `datetime-local` no fuso de São Paulo (para preencher o formulário). */
export function fromIsoToLocalDateTime(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    (parts.find((part) => part.type === type) as Intl.DateTimeFormatPart).value;

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DEFAULT_TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function toEventRow(input: EventInput): EventRow {
  const maxGiftCents = parseBrlToCents(input.maxGift);
  if (maxGiftCents !== null && (maxGiftCents < 0 || maxGiftCents > 100_000_000)) {
    throw new Error("O valor máximo do presente deve ficar entre R$ 0,00 e R$ 1.000.000,00.");
  }

  return {
    name: input.name,
    description: input.description || null,
    location: input.location || null,
    address: input.address || null,
    starts_at: toSaoPauloIso(input.startsAt),
    draw_scheduled_at:
      input.hasSecretSanta && input.drawScheduledAt
        ? toSaoPauloIso(input.drawScheduledAt)
        : null,
    timezone: DEFAULT_TIMEZONE,
    max_gift_cents: maxGiftCents,
    extra_info: input.extraInfo || null,
    has_secret_santa: input.hasSecretSanta,
  };
}
