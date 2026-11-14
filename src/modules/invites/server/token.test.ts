import { describe, expect, it } from "vitest";
import {
  decryptInviteToken,
  encryptInviteToken,
  generateInviteToken,
  hashInviteToken,
} from "./token";

const SECRET = "segredo-de-teste-com-32-caracteres-ok";

describe("token de convite", () => {
  it("gera tokens aleatórios e distintos", () => {
    const first = generateInviteToken();
    const second = generateInviteToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("gera hash estável e não reversível", () => {
    const token = generateInviteToken();
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
    expect(hashInviteToken(token)).toHaveLength(64);
    expect(hashInviteToken(token)).not.toContain(token);
  });

  it("cifra e recupera o token para reexibir o link", () => {
    const token = generateInviteToken();
    const ciphertext = encryptInviteToken(token, SECRET);
    expect(ciphertext).not.toContain(token);
    expect(decryptInviteToken(ciphertext, SECRET)).toBe(token);
    expect(decryptInviteToken(ciphertext, "outro-segredo-qualquer-123")).toBeNull();
  });
});
