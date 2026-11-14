import { describe, expect, it } from "vitest";
import {
  CAPTCHA_TTL_SECONDS,
  answerOf,
  generateQuestion,
  isExpired,
  questionText,
  validateAnswer,
  type CaptchaPayload,
} from "./captcha";

describe("captcha", () => {  it("gera apenas somas e subtrações sem resultado negativo", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      let calls = 0;
      const question = generateQuestion((min, max) => {
        calls += 1;
        const span = max - min + 1;
        return min + (((seed * 7 + calls) % span + span) % span);
      });
      expect(question.a).toBeGreaterThanOrEqual(1);
      expect(question.b).toBeGreaterThanOrEqual(1);
      expect(answerOf(question)).toBeGreaterThanOrEqual(0);
    }
  });

  it("gera pergunta determinística e texto em palavras", () => {
    let call = 0;
    const values = [0, 7, 2]; // operação "+", a=7, b=2
    const question = generateQuestion(() => {
      const value = values[call] ?? 1;
      call += 1;
      return value;
    });
    expect(question).toEqual({ a: 7, op: "+", b: 2 });
    expect(answerOf(question)).toBe(9);
    expect(questionText(question)).toBe("Quanto é 7 mais 2?");

    const subtraction = generateQuestion(() => 2);
    expect(subtraction.op).toBe("-");
    expect(questionText(subtraction)).toContain("menos");
    expect(answerOf(subtraction)).toBeGreaterThanOrEqual(0);
  });

  it("rejeita respostas fora do formato numérico", () => {
    const payload: CaptchaPayload = { v: 1, exp: 1, n: "x", h: "007" };
    expect(validateAnswer(payload, "", () => "007")).toBe(false);
    expect(validateAnswer(payload, "abc", () => "007")).toBe(false);
    expect(validateAnswer(payload, "1.5", () => "007")).toBe(false);
    expect(validateAnswer(payload, "007", (value) => value)).toBe(true);
    expect(validateAnswer(payload, "7", (value) => value)).toBe(false);
  });

  it("detecta expiração", () => {
    const now = 1_000;
    const payload: CaptchaPayload = { v: 1, exp: now + CAPTCHA_TTL_SECONDS, n: "n", h: "h" };
    expect(isExpired(payload, now)).toBe(false);
    expect(isExpired(payload, payload.exp)).toBe(true);
    expect(isExpired(payload, payload.exp + 1)).toBe(true);
  });
});
