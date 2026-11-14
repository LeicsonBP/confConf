import { describe, expect, it } from "vitest";
import {
  DIETARY_LABELS,
  DIETARY_OPTIONS,
  DIETARY_VALUES,
  labelForRestriction,
} from "./restrictions";

describe("restrições alimentares", () => {
  it("expõe opções e valores consistentes", () => {
    expect(DIETARY_OPTIONS).toHaveLength(5);
    expect(DIETARY_VALUES).toEqual([
      "vegetariano",
      "vegano",
      "sem_lactose",
      "sem_gluten",
      "outra",
    ]);
    expect(DIETARY_LABELS.vegano).toBe("Vegano");
  });

  it("rotula valores conhecidos e desconhecidos", () => {
    expect(labelForRestriction("sem_gluten")).toBe("Sem glúten");
    expect(labelForRestriction("outra_coisa")).toBe("outra_coisa");
  });
});
