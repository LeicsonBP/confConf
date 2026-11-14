import { createHash, createHmac, timingSafeEqual } from "node:crypto";

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

export function getAppSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("APP_SECRET ausente ou muito curto (mínimo de 16 caracteres).");
  }
  return secret;
}
