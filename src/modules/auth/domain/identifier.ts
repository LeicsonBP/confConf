import { AppError } from "@/shared/errors";

const BASE_MAX_LENGTH = 20;
const BASE_MIN_LENGTH = 2;
const DIGITS_MIN = 100;
const DIGITS_MAX = 999;
/** Primeiro nome normalizado + 3 dígitos (ex.: leicson745). */
const USERNAME_PATTERN = /^[a-z0-9]{2,21}[0-9]{3}$/;
const FALLBACK_BASE = "participante";

export type RandomDigits = () => number;

function defaultRandomDigits(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const value = buffer[0] ?? 0;
  return DIGITS_MIN + (value % (DIGITS_MAX - DIGITS_MIN + 1));
}

/**
 * Usuário de login do participante: **primeiro nome** normalizado (sem acentos,
 * minúsculas, sem símbolos) + 3 dígitos. Ex.: "Leicson Palhano" -> "leicson745".
 */
export class Identifier {
  static readonly pattern = USERNAME_PATTERN;

  static normalizeBase(fullName: string): string {
    const firstName = fullName.trim().split(/\s+/)[0] ?? "";
    const normalized = firstName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, BASE_MAX_LENGTH);

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

    return `${base}${digits}`;
  }

  static isValid(value: string): boolean {
    return USERNAME_PATTERN.test(value);
  }

  static assertValid(value: string): string {
    if (!Identifier.isValid(value)) {
      throw new AppError(
        "validation_error",
        "Usuário inválido. Use apenas letras minúsculas e números, sem espaços ou símbolos.",
      );
    }
    return value;
  }
}
