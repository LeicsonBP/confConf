import { describe, expect, it } from "vitest";
import { createCaptcha, verifyCaptcha } from "./captcha";

const SECRET = "segredo-de-teste-com-32-caracteres-ok";
const NOW = 1_700_000_000_000;

function questionRandom(): () => number {
  const values = [0, 7, 3]; // soma: 7 + 3 = 10
  let call = 0;
  return () => {
    const value = values[call] ?? 0;
    call += 1;
    return value;
  };
}

describe("captcha server", () => {
  it("cria pergunta e aceita a resposta correta", () => {
    const { question, token } = createCaptcha(NOW, SECRET, questionRandom());
    expect(question).toBe("Quanto é 7 mais 3?");
    expect(verifyCaptcha(token, "10", NOW, SECRET)).toBe(true);
    expect(verifyCaptcha(token, " 10 ", NOW, SECRET)).toBe(true);
  });

  it("recusa resposta errada", () => {
    const { token } = createCaptcha(NOW, SECRET, questionRandom());
    expect(verifyCaptcha(token, "11", NOW, SECRET)).toBe(false);
    expect(verifyCaptcha(token, "", NOW, SECRET)).toBe(false);
  });

  it("recusa token expirado", () => {
    const { token } = createCaptcha(NOW, SECRET, questionRandom());
    const afterExpiry = NOW + 11 * 60 * 1000;
    expect(verifyCaptcha(token, "10", afterExpiry, SECRET)).toBe(false);
  });

  it("recusa token adulterado ou com outro segredo", () => {
    const { token } = createCaptcha(NOW, SECRET, questionRandom());
    expect(verifyCaptcha(`${token}x`, "10", NOW, SECRET)).toBe(false);
    expect(verifyCaptcha(token, "10", NOW, "outro-segredo-qualquer-123")).toBe(false);
    expect(verifyCaptcha("lixo", "10", NOW, SECRET)).toBe(false);
    expect(verifyCaptcha("v1.aaa.bbb", "10", NOW, SECRET)).toBe(false);
  });
});
