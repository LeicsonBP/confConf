import { describe, expect, it } from "vitest";
import { buildFoodPlan, formatQuantityRange, type FoodParticipant } from "./rules";

function participant(
  fullName: string,
  restrictions: string[] = [],
  other: string | null = null,
): FoodParticipant {
  return { fullName, restrictions, other };
}

describe("buildFoodPlan", () => {
  it("conta vegano uma única vez como vegetariano", () => {
    const plan = buildFoodPlan([
      participant("Ana", ["vegano"]),
      participant("Bia", ["vegetariano"]),
      participant("Caio", ["sem_lactose", "sem_gluten"]),
      participant("Duda", ["outra"], "alergia a camarão"),
    ]);

    expect(plan.total).toBe(4);
    const counts = Object.fromEntries(plan.restrictions.map((item) => [item.key, item.count]));
    expect(counts).toEqual({
      vegetariano: 2,
      vegano: 1,
      sem_lactose: 1,
      sem_gluten: 1,
      outra: 1,
    });
    expect(plan.others).toEqual([{ name: "Duda", detail: "alergia a camarão" }]);
  });

  it("calcula faixas por pessoa e o fator dos descartáveis", () => {
    const plan = buildFoodPlan(
      Array.from({ length: 10 }, (_, index) => participant(`Pessoa ${index + 1}`)),
      { generatedAt: "2026-11-14T12:00:00.000Z" },
    );

    const byKey = Object.fromEntries(plan.estimates.map((item) => [item.key, item]));
    expect(byKey.salgadinhos?.min).toBe(80);
    expect(byKey.salgadinhos?.max).toBe(120);
    expect(byKey.descartaveis?.min).toBe(12);
    expect(byKey.descartaveis?.max).toBe(12);
    expect(byKey.agua?.min).toBe(3000);
    expect(plan.generatedAt).toBe("2026-11-14T12:00:00.000Z");
    expect(plan.hasRestrictedOptions).toBe(false);
  });

  it("cria opções restritas com piso por pessoa", () => {
    const plan = buildFoodPlan([
      participant("Ana", ["sem_lactose"]),
      participant("Bia", ["sem_lactose"]),
      participant("Caio", ["sem_gluten"]),
    ]);

    const doces = plan.estimates.find((item) => item.key === "doces");
    expect(doces?.restricted).toMatchObject({
      count: 2,
      min: 8,
      max: 12,
      label: "Doces sem lactose",
    });

    const bolo = plan.estimates.find((item) => item.key === "bolo");
    expect(bolo?.restricted).toMatchObject({ count: 1, min: 100, max: 150 });
    expect(plan.hasRestrictedOptions).toBe(true);
  });

  it("zera tudo sem participantes", () => {
    const plan = buildFoodPlan([]);
    expect(plan.total).toBe(0);
    expect(plan.others).toEqual([]);
    expect(plan.hasRestrictedOptions).toBe(false);
    for (const estimate of plan.estimates) {
      expect(estimate.min).toBe(0);
      expect(estimate.max).toBe(0);
    }
  });

  it("calcula apenas os itens selecionados", () => {
    const participants = [participant("Ana"), participant("Bia")];
    const plan = buildFoodPlan(participants, { selected: ["doces", "agua"] });
    expect(plan.estimates.map((item) => item.key)).toEqual(["doces", "agua"]);
    expect(plan.estimates.every((item) => item.min > 0)).toBe(true);

    const none = buildFoodPlan(participants, { selected: [] });
    expect(none.estimates).toEqual([]);
    expect(none.restrictions).toHaveLength(5);
  });
});

describe("formatQuantityRange", () => {
  it("formata unidades, litros e quilos", () => {
    expect(formatQuantityRange(8, 12, "un")).toBe("8–12 un");
    expect(formatQuantityRange(3000, 3000, "ml")).toBe("3,0 L");
    expect(formatQuantityRange(1000, 1500, "g")).toBe("1,0–1,5 kg");
    expect(formatQuantityRange(300, 400, "ml")).toBe("300–400 ml");
    expect(formatQuantityRange(12, 12, "jogos")).toBe("12 jogos");
  });
});
