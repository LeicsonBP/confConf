export type CaptchaOperation = "+" | "-";

export interface CaptchaQuestion {
  a: number;
  op: CaptchaOperation;
  b: number;
}

export interface CaptchaPayload {
  /** Versão do formato do token. */
  v: 1;
  /** Expiração em segundos desde a época. */
  exp: number;
  /** Nonce para evitar tokens repetidos. */
  n: string;
  /** SHA-256 hexadecimal da resposta correta. */
  h: string;
}

export const CAPTCHA_TTL_SECONDS = 600;
export const CAPTCHA_MIN_VALUE = 1;
export const CAPTCHA_MAX_VALUE = 9;

export type RandomInt = (min: number, max: number) => number;

/**
 * Gera uma conta de soma ou subtração sem resultado negativo.
 * A operação é exibida em palavras para funcionar bem com leitores de tela.
 */
export function generateQuestion(random: RandomInt): CaptchaQuestion {
  const op: CaptchaOperation = random(0, 1) === 0 ? "+" : "-";
  const a = random(CAPTCHA_MIN_VALUE, CAPTCHA_MAX_VALUE);
  const b = random(CAPTCHA_MIN_VALUE, CAPTCHA_MAX_VALUE);

  if (op === "-") {
    return { a: Math.max(a, b), op, b: Math.min(a, b) };
  }
  return { a, op, b };
}

export function answerOf(question: CaptchaQuestion): number {
  return question.op === "+" ? question.a + question.b : question.a - question.b;
}

export function questionText(question: CaptchaQuestion): string {
  const operator = question.op === "+" ? "mais" : "menos";
  return `Quanto é ${question.a} ${operator} ${question.b}?`;
}

export function isExpired(payload: CaptchaPayload, nowSeconds: number): boolean {
  return payload.exp <= nowSeconds;
}

export function validateAnswer(
  payload: CaptchaPayload,
  answer: string,
  hash: (value: string) => string,
): boolean {
  const normalized = answer.trim();
  if (!/^-?\d{1,3}$/.test(normalized)) {
    return false;
  }
  return hash(normalized) === payload.h;
}
