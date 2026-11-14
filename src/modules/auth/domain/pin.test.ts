import { describe, expect, it } from "vitest";
import { AppError } from "@/shared/errors";
import { PinPolicy } from "./pin";

describe("PinPolicy", () => {
  it("aceita de 4 a 8 dígitos", () => {
    expect(PinPolicy.isValid("1234")).toBe(true);
    expect(PinPolicy.isValid("123456")).toBe(true);
    expect(PinPolicy.isValid("12345678")).toBe(true);
  });

  it("recusa menos de 4, mais de 8, vazio e não numérico", () => {
    expect(PinPolicy.isValid("123")).toBe(false);
    expect(PinPolicy.isValid("123456789")).toBe(false);
    expect(PinPolicy.isValid("")).toBe(false);
    expect(PinPolicy.isValid("12a4")).toBe(false);
    expect(PinPolicy.isValid("12 4")).toBe(false);
  });

  it("preenche com zeros à esquerda até 6 caracteres", () => {
    expect(PinPolicy.normalize("1234")).toBe("001234");
    expect(PinPolicy.normalize("0000")).toBe("000000");
    expect(PinPolicy.normalize("123456")).toBe("123456");
    expect(PinPolicy.normalize("12345678")).toBe("12345678");
  });

  it("rejeita PIN inválido na normalização", () => {
    expect(() => PinPolicy.normalize("123")).toThrow(AppError);
  });

  it("sinaliza PIN fraco abaixo de 6 dígitos", () => {
    expect(PinPolicy.isWeak("1234")).toBe(true);
    expect(PinPolicy.isWeak("123456")).toBe(false);
  });
});
