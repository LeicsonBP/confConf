import { AppError } from "@/shared/errors";

const BASE_MAX_LENGTH = 40;
const BASE_MIN_LENGTH = 2;
const DIGITS_MIN = 100;
const DIGITS_MAX = 999;
const IDENTIFIER_PATTERN = /^[a-z0-9-]{2,40}-[0-9]{3}$/;
const FALLBACK_BASE = "participante";

export type RandomDigits = () => number;

function defaultRandomDigits(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const value = buffer[0] ?? 0;
  return DIGITS_MIN + (value % (DIGITS_MAX - DIGITS_MIN + 1));
}

/**
 * Identificador de login do participante: nome normalizado + 3 dígitos.
 * Ex.: "Maria Silva" -> "maria-silva-482".
 */
export class Identifier {
  static readonly pattern = IDENTIFIER_PATTERN;

  /** Remove acentos, símbolos e espaços, deixando apenas [a-z0-9-]. */
  static normalizeBase(fullName: string): string {
    const normalized = fullName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, BASE_MAX_LENGTH)
      .replace(/-+$/g, "");

    return normalized.length >= BASE_MIN_LENGTH ? normalized : FALLBACK_BASE;
  }

  static generate(fullName: string, random: RandomDigits = defaultRandomDigits): string {
    const base = Identifier.normalizeBase(fullName);
    const digits = random();

    if (!Number.isInteger(digits) || digits < DIGITS_MIN || digits > DIGITS_MAX) {
      throw new AppError(
        "internal",
        "Gerador de dígitos retornou um valor fora da faixa de 100 a 999.",
      );
    }

    return `${base}-${digits}`;
  }

  static isValid(value: string): boolean {
    return IDENTIFIER_PATTERN.test(value);
  }

  static assertValid(value: string): string {
    if (!Identifier.isValid(value)) {
      throw new AppError(
        "validation_error",
        "Identificador inválido. Use o formato nome-sobrenome-000.",
      );
    }
    return value;
  }
}
