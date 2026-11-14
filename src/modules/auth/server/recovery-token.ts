import { fromBase64Url, getAppSecret, hmacSha256, safeEqual, toBase64Url } from "@/lib/crypto";

export interface RecoveryTokenPayload {
  /** Id do usuário (auth.users.id). */
  u: string;
  /** Expiração em segundos desde a época. */
  exp: number;
}

export const RECOVERY_TTL_SECONDS = 300;
const VERSION = "r1";

function sign(payload: string, secret: string): string {
  return toBase64Url(hmacSha256(payload, secret));
}

export function createRecoveryToken(
  userId: string,
  secret: string = getAppSecret(),
  now: number = Date.now(),
): string {
  const payload: RecoveryTokenPayload = {
    u: userId,
    exp: Math.floor(now / 1000) + RECOVERY_TTL_SECONDS,
  };
  const encoded = toBase64Url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${VERSION}.${encoded}.${sign(encoded, secret)}`;
}

export function verifyRecoveryToken(
  token: string,
  secret: string = getAppSecret(),
  now: number = Date.now(),
): { userId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) return null;

  const [, encoded, signature] = parts;
  if (!encoded || !signature) return null;

  const expected = fromBase64Url(sign(encoded, secret));
  const provided = fromBase64Url(signature);
  if (!safeEqual(expected, provided)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encoded).toString("utf8")) as RecoveryTokenPayload;
    if (!payload?.u || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(now / 1000)) return null;
    return { userId: payload.u };
  } catch {
    return null;
  }
}
