import { describe, expect, it } from "vitest";
import { AppError } from "@/shared/errors";
import { Identifier } from "./identifier";

describe("Identifier", () => {
  describe("normalizeBase", () => {
    it("usa apenas o primeiro nome, sem acentos", () => {
      expect(Identifier.normalizeBase("João D'Ávila")).toBe("joao");
      expect(Identifier.normalizeBase("Maria Silva")).toBe("maria");
    });

    it("remove símbolos, espaços e hífens do primeiro nome", () => {
      expect(Identifier.normalizeBase("  Ana-Maria  Silva ")).toBe("anamaria");
      expect(Identifier.normalizeBase("Ana & Bia")).toBe("ana");
    });

    it("trunca nomes muito longos em 20 caracteres", () => {
      const base = Identifier.normalizeBase("a".repeat(60));
      expect(base).toHaveLength(20);
    });

    it("usa fallback quando não sobra nada utilizável", () => {
      expect(Identifier.normalizeBase("###")).toBe("participante");
      expect(Identifier.normalizeBase("")).toBe("participante");
    });
  });

  describe("generate", () => {
    it("acrescenta três dígitos ao primeiro nome, sem separador", () => {
      expect(Identifier.generate("Leicson Palhano", () => 745)).toBe("leicson745");
      expect(Identifier.generate("Maria Silva", () => 482)).toBe("maria482");
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
      expect(Identifier.isValid("maria482")).toBe(true);
      expect(Identifier.isValid("leicson745")).toBe(true);
      expect(Identifier.isValid("participante123")).toBe(true);
    });

    it("recusa formatos inválidos", () => {
      expect(Identifier.isValid("Maria482")).toBe(false);
      expect(Identifier.isValid("maria-482")).toBe(false);
      expect(Identifier.isValid("maria_482")).toBe(false);
      expect(Identifier.isValid("ab1")).toBe(false);
      expect(Identifier.isValid("maria")).toBe(false);
      expect(Identifier.assertValid("maria482")).toBe("maria482");
      expect(() => Identifier.assertValid("inválido")).toThrow(AppError);
    });
  });
});
