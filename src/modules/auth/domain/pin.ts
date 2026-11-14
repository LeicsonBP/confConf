import { AppError } from "@/shared/errors";

/**
 * O briefing pede PIN numérico "de até 6 dígitos"; o cliente decidiu 4 a 8.
 * O Supabase Auth (GoTrue) exige no mínimo 6 caracteres, então o PIN é
 * preenchido com zeros à esquerda antes de chegar ao provedor.
 */
export class PinPolicy {
  static readonly MIN_DIGITS = 4;
  static readonly MAX_DIGITS = 8;
  static readonly PROVIDER_MIN_LENGTH = 6;
  static readonly ENTROPY_WARNING_BELOW = 6;

  static isValid(pin: string): boolean {
    return new RegExp(`^\\d{${PinPolicy.MIN_DIGITS},${PinPolicy.MAX_DIGITS}}$`).test(pin);
  }

  /** Valida e devolve o valor que será enviado ao GoTrue (mínimo de 6 caracteres). */
  static normalize(pin: string): string {
    if (!PinPolicy.isValid(pin)) {
      throw new AppError(
        "validation_error",
        `O PIN deve ter de ${PinPolicy.MIN_DIGITS} a ${PinPolicy.MAX_DIGITS} dígitos numéricos.`,
      );
    }
    return pin.padStart(PinPolicy.PROVIDER_MIN_LENGTH, "0");
  }

  static isWeak(pin: string): boolean {
    return pin.length < PinPolicy.ENTROPY_WARNING_BELOW;
  }
}
