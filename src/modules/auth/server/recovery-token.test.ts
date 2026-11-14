import { describe, expect, it } from "vitest";
import { createRecoveryToken, verifyRecoveryToken } from "./recovery-token";

const SECRET = "segredo-de-teste-com-32-caracteres-ok";
const NOW = 1_700_000_000_000;
const USER = "7f32442b-1bfa-4491-96f2-35702a66fcaa";

describe("recovery token", () => {
  it("cria e valida um token", () => {
    const token = createRecoveryToken(USER, SECRET, NOW);
    expect(verifyRecoveryToken(token, SECRET, NOW + 1000)).toEqual({ userId: USER });
  });

  it("rejeita token expirado", () => {
    const token = createRecoveryToken(USER, SECRET, NOW);
    expect(verifyRecoveryToken(token, SECRET, NOW + 301_000)).toBeNull();
  });

  it("rejeita token adulterado ou com outro segredo", () => {
    const token = createRecoveryToken(USER, SECRET, NOW);
    expect(verifyRecoveryToken(`${token}x`, SECRET, NOW)).toBeNull();
    expect(verifyRecoveryToken(token, "outro-segredo-qualquer-123", NOW)).toBeNull();
    expect(verifyRecoveryToken("lixo", SECRET, NOW)).toBeNull();
    expect(verifyRecoveryToken("r1.abc.def", SECRET, NOW)).toBeNull();
  });
});
