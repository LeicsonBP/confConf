import { randomInt, randomUUID } from "node:crypto";
import {
  fromBase64Url,
  getAppSecret,
  hmacSha256,
  safeEqual,
  sha256Hex,
  toBase64Url,
} from "@/lib/crypto";
import {
  answerOf,
  CAPTCHA_MAX_VALUE,
  CAPTCHA_MIN_VALUE,
  CAPTCHA_TTL_SECONDS,
  generateQuestion,
  isExpired,
  questionText,
  validateAnswer,
  type CaptchaPayload,
  type RandomInt,
} from "../domain/captcha";

const VERSION = "v1";

const cryptoRandom: RandomInt = (min, max) => randomInt(min, max + 1);

function sign(payload: string, secret: string): string {
  return toBase64Url(hmacSha256(payload, secret));
}

function encodePayload(payload: CaptchaPayload): string {
  return toBase64Url(Buffer.from(JSON.stringify(payload), "utf8"));
}

/**
 * Cria a pergunta e o token assinado. O token carrega apenas hash da resposta,
 * expiração e nonce — nunca a resposta em claro.
 */
export function createCaptcha(
  now: number = Date.now(),
  secret: string = getAppSecret(),
  random: RandomInt = cryptoRandom,
): { question: string; token: string } {
  const challenge = generateQuestion(random);
  const payload: CaptchaPayload = {
    v: 1,
    exp: Math.floor(now / 1000) + CAPTCHA_TTL_SECONDS,
    n: randomUUID(),
    h: sha256Hex(String(answerOf(challenge))),
  };
  const encoded = encodePayload(payload);
  return {
    question: questionText(challenge),
    token: `${VERSION}.${encoded}.${sign(encoded, secret)}`,
  };
}

export function verifyCaptcha(
  token: string,
  answer: string,
  now: number = Date.now(),
  secret: string = getAppSecret(),
): boolean {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) {
    return false;
  }

  const [, encoded, signature] = parts;
  if (!encoded || !signature) {
    return false;
  }

  const expected = fromBase64Url(sign(encoded, secret));
  const provided = fromBase64Url(signature);
  if (!safeEqual(expected, provided)) {
    return false;
  }

  let payload: CaptchaPayload;
  try {
    payload = JSON.parse(fromBase64Url(encoded).toString("utf8")) as CaptchaPayload;
  } catch {
    return false;
  }

  if (payload?.v !== 1 || typeof payload.exp !== "number" || typeof payload.h !== "string") {
    return false;
  }

  if (isExpired(payload, Math.floor(now / 1000))) {
    return false;
  }

  return validateAnswer(payload, answer, sha256Hex);
}

export { CAPTCHA_MIN_VALUE, CAPTCHA_MAX_VALUE };
