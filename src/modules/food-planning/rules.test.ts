import { describe, expect, it } from "vitest";
import {
  buildFoodPlan,
  formatQuantity,
  roundUpToFive,
  type FoodParticipant,
} from "./rules";

function participant(
  fullName: string,
  restrictions: string[] = [],
  other: string | null = null,
): FoodParticipant {
  return { fullName, restrictions, other };
}

describe("roundUpToFive", () => {
  it("arredonda para cima em múltiplos de 5", () => {
    expect(roundUpToFive(0)).toBe(0);
    expect(roundUpToFive(1)).toBe(5);
    expect(roundUpToFive(4)).toBe(5);
    expect(roundUpToFive(5)).toBe(5);
    expect(roundUpToFive(6)).toBe(10);
    expect(roundUpToFive(12)).toBe(15);
    expect(roundUpToFive(120)).toBe(120);
  });
});

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

  it("usa números únicos múltiplos de 5 para 10 pessoas", () => {
    const plan = buildFoodPlan(
      Array.from({ length: 10 }, (_, index) => participant(`Pessoa ${index + 1}`)),
      { generatedAt: "2026-11-14T12:00:00.000Z" },
    );

    const byKey = Object.fromEntries(plan.estimates.map((item) => [item.key, item]));
    expect(byKey.salgados?.quantity).toBe(120);
    expect(byKey.doces?.quantity).toBe(50);
    expect(byKey.bolo?.quantity).toBe(1000);
    expect(byKey.agua?.quantity).toBe(5000);
    expect(byKey.descartaveis?.quantity).toBe(12);
    expect(byKey.refrigerante?.packaging).toEqual([
      { label: "500 ml", count: 8 },
      { label: "1 L", count: 4 },
      { label: "1,5 L", count: 3 },
      { label: "2 L", count: 2 },
    ]);
    expect(byKey.gelo?.packaging).toEqual([{ label: "saco(s) de 5 kg", count: 1 }]);
    expect(plan.generatedAt).toBe("2026-11-14T12:00:00.000Z");
    expect(plan.hasRestrictedOptions).toBe(false);
  });

  it("arredonda quantidades pequenas para múltiplos de 5", () => {
    const plan = buildFoodPlan([participant("Ana")]);
    const byKey = Object.fromEntries(plan.estimates.map((item) => [item.key, item]));
    expect(byKey.salgados?.quantity).toBe(15);
    expect(byKey.doces?.quantity).toBe(5);
    expect(byKey.descartaveis?.quantity).toBe(2);
  });

  it("cria opções restritas com piso por pessoa e múltiplo de 5", () => {
    const plan = buildFoodPlan([
      participant("Ana", ["sem_lactose"]),
      participant("Bia", ["sem_lactose"]),
      participant("Caio", ["sem_gluten"]),
    ]);

    const doces = plan.estimates.find((item) => item.key === "doces");
    expect(doces?.restricted).toMatchObject({
      count: 2,
      quantity: 10,
      label: "Doces sem lactose",
    });

    const bolo = plan.estimates.find((item) => item.key === "bolo");
    expect(bolo?.restricted).toMatchObject({ count: 1, quantity: 100 });
    expect(plan.hasRestrictedOptions).toBe(true);
  });

  it("zera tudo sem participantes", () => {
    const plan = buildFoodPlan([]);
    expect(plan.total).toBe(0);
    expect(plan.others).toEqual([]);
    expect(plan.hasRestrictedOptions).toBe(false);
    for (const estimate of plan.estimates) {
      expect(estimate.quantity).toBe(0);
      expect(estimate.packaging).toBeUndefined();
    }
  });

  it("calcula gelo em sacos de 5 kg", () => {
    const plan = buildFoodPlan(
      Array.from({ length: 20 }, (_, index) => participant(`Pessoa ${index + 1}`)),
    );
    const gelo = plan.estimates.find((item) => item.key === "gelo");
    expect(gelo?.quantity).toBe(10000);
    expect(gelo?.packaging).toEqual([{ label: "saco(s) de 5 kg", count: 2 }]);
  });

  it("calcula apenas os itens selecionados", () => {
    const participants = [participant("Ana"), participant("Bia")];
    const plan = buildFoodPlan(participants, { selected: ["doces", "agua"] });
    expect(plan.estimates.map((item) => item.key)).toEqual(["doces", "agua"]);
    expect(plan.estimates.every((item) => item.quantity > 0)).toBe(true);

    const none = buildFoodPlan(participants, { selected: [] });
    expect(none.estimates).toEqual([]);
    expect(none.restrictions).toHaveLength(5);
  });
});

describe("formatQuantity", () => {
  it("formata unidades, litros e quilos", () => {
    expect(formatQuantity(50, "un")).toBe("50 un");
    expect(formatQuantity(3000, "ml")).toBe("3,0 L");
    expect(formatQuantity(1000, "g")).toBe("1,0 kg");
    expect(formatQuantity(120, "g")).toBe("120 g");
    expect(formatQuantity(15, "jogos")).toBe("15 jogos");
  });
});
