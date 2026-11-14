import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/** Utilitários criptográficos do servidor. Não importar em componentes de cliente. */

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hmacSha256(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload, "utf8").digest();
}

export function toBase64Url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

export function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export function safeEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Deriva uma chave AES de 32 bytes a partir do segredo da aplicação. */
function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

/**
 * Cifra um texto com AES-256-GCM.
 * Formato: `<iv>.<tag>.<ciphertext>`, tudo em base64url.
 */
export function encryptSecret(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/** Decifra o formato de `encryptSecret`. Retorna `null` se o payload for inválido. */
export function decryptSecret(payload: string, secret: string): string | null {
  const parts = payload.split(".");
  if (parts.length !== 3) return null;

  const [ivPart, tagPart, dataPart] = parts;
  if (!ivPart || !tagPart || !dataPart) return null;

  try {
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), fromBase64Url(ivPart));
    decipher.setAuthTag(fromBase64Url(tagPart));
    return Buffer.concat([
      decipher.update(fromBase64Url(dataPart)),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function getAppSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("APP_SECRET ausente ou muito curto (mínimo de 16 caracteres).");
  }
  return secret;
}
