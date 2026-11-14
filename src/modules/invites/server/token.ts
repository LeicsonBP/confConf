import { randomBytes } from "node:crypto";
import { decryptSecret, encryptSecret, getAppSecret, sha256Hex } from "@/lib/crypto";

export const INVITE_TOKEN_BYTES = 32;

/** Token opaco e aleatório (base64url, 43 caracteres). */
export function generateInviteToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return sha256Hex(token);
}

export function encryptInviteToken(token: string, secret: string = getAppSecret()): string {
  return encryptSecret(token, secret);
}

export function decryptInviteToken(ciphertext: string, secret: string = getAppSecret()): string | null {
  return decryptSecret(ciphertext, secret);
}
