import { describe, expect, it } from "vitest";
import { AppError } from "@/shared/errors";
import { Identifier } from "./identifier";

describe("Identifier", () => {
  describe("normalizeBase", () => {
    it("remove acentos e colapsa separadores", () => {
      expect(Identifier.normalizeBase("João D'Ávila")).toBe("joao-d-avila");
    });

    it("converte espaços e símbolos em hífen único", () => {
      expect(Identifier.normalizeBase("  Maria   Silva  ")).toBe("maria-silva");
      expect(Identifier.normalizeBase("Ana & Bia")).toBe("ana-bia");
    });

    it("trunca nomes muito longos em 40 caracteres", () => {
      const base = Identifier.normalizeBase("a".repeat(60));
      expect(base).toHaveLength(40);
    });

    it("usa fallback quando não sobra nada utilizável", () => {
      expect(Identifier.normalizeBase("###")).toBe("participante");
    });
  });

  describe("generate", () => {
    it("acrescenta três dígitos ao nome normalizado", () => {
      expect(Identifier.generate("Maria Silva", () => 482)).toBe("maria-silva-482");
    });

    it("gera identificador válido com o gerador padrão", () => {
      expect(Identifier.isValid(Identifier.generate("Maria Silva"))).toBe(true);
    });

    it("rejeita gerador fora da faixa", () => {
      expect(() => Identifier.generate("Maria Silva", () => 7)).toThrow(AppError);
      expect(() => Identifier.generate("Maria Silva", () => 1000)).toThrow(AppError);
      expect(() => Identifier.generate("Maria Silva", () => 12.5)).toThrow(AppError);
    });
  });

  describe("validação", () => {
    it("aceita o formato esperado", () => {
      expect(Identifier.isValid("maria-silva-482")).toBe(true);
      expect(Identifier.isValid("ab-100")).toBe(true);
    });

    it("recusa formatos inválidos", () => {
      expect(Identifier.isValid("Maria-Silva-482")).toBe(false);
      expect(Identifier.isValid("maria-silva")).toBe(false);
      expect(Identifier.isValid("maria-silva-12")).toBe(false);
      expect(Identifier.isValid("maria_silva-482")).toBe(false);
      expect(Identifier.assertValid("maria-silva-482")).toBe("maria-silva-482");
      expect(() => Identifier.assertValid("invalido")).toThrow(AppError);
    });
  });
});
