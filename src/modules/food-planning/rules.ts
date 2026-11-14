import { DIETARY_LABELS } from "@/modules/participants/domain/restrictions";

export type QuantityUnit = "un" | "g" | "ml" | "jogos";

export interface FoodParticipant {
  fullName: string;
  restrictions: string[];
  other: string | null;
}

export type RestrictionKey =
  | "vegetariano"
  | "vegano"
  | "sem_lactose"
  | "sem_gluten"
  | "outra";

export interface RestrictionSummary {
  key: RestrictionKey;
  label: string;
  count: number;
}

export interface OtherRestriction {
  name: string;
  detail: string;
}

export interface RestrictedEstimate {
  label: string;
  note: string;
  count: number;
  min: number;
  max: number;
}

export interface FoodEstimate {
  key: string;
  label: string;
  unit: QuantityUnit;
  min: number;
  max: number;
  note: string;
  restricted?: RestrictedEstimate;
}

export interface FoodPlan {
  total: number;
  restrictions: RestrictionSummary[];
  others: OtherRestriction[];
  estimates: FoodEstimate[];
  generatedAt: string;
  hasRestrictedOptions: boolean;
}

export interface FoodPlanOptions {
  /** Itens escolhidos para compra; vazio = nenhum cálculo. */
  selected?: string[];
  generatedAt?: string;
}

interface FoodRule {
  key: string;
  label: string;
  unit: QuantityUnit;
  min: number;
  max: number;
  note: string;
  /** Multiplicador direto (ex.: descartáveis = 1,2 × pessoas). */
  factor?: number;
  restricted?: {
    restriction: "sem_lactose" | "sem_gluten";
    label: string;
    note: string;
  };
}

/**
 * Premissas por pessoa (revisadas com o cliente no M5).
 * Valores em faixas; a tela sempre apresenta como estimativa.
 */
export const FOOD_RULES: FoodRule[] = [
  { key: "salgadinhos", label: "Salgadinhos", unit: "un", min: 8, max: 12, note: "Base do cardápio" },
  {
    key: "salgados",
    label: "Salgados assados/fritos",
    unit: "un",
    min: 6,
    max: 10,
    note: "Alternar tipos",
  },
  {
    key: "doces",
    label: "Doces",
    unit: "un",
    min: 4,
    max: 6,
    note: "Incluir opção sem lactose",
    restricted: {
      restriction: "sem_lactose",
      label: "Doces sem lactose",
      note: "Para quem não consome lactose",
    },
  },
  {
    key: "bolo",
    label: "Bolo",
    unit: "g",
    min: 100,
    max: 150,
    note: "Opção sem glúten",
    restricted: {
      restriction: "sem_gluten",
      label: "Bolo sem glúten",
      note: "Para quem não consome glúten",
    },
  },
  {
    key: "refrigerante",
    label: "Refrigerante",
    unit: "ml",
    min: 300,
    max: 400,
    note: "Incluir zero",
  },
  { key: "agua", label: "Água", unit: "ml", min: 300, max: 300, note: "" },
  { key: "gelo", label: "Gelo", unit: "g", min: 300, max: 500, note: "" },
  {
    key: "descartaveis",
    label: "Descartáveis",
    unit: "jogos",
    min: 0,
    max: 0,
    note: "Pratos, copos e guardanapos",
    factor: 1.2,
  },
];

function hasRestriction(participant: FoodParticipant, value: string): boolean {
  return participant.restrictions.includes(value);
}

export const FOOD_KEYS: string[] = FOOD_RULES.map((rule) => rule.key);

export function buildFoodPlan(
  participants: FoodParticipant[],
  options: FoodPlanOptions = {},
): FoodPlan {
  const total = participants.length;
  const selected = options.selected ?? FOOD_KEYS;
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const vegan = participants.filter((participant) => hasRestriction(participant, "vegano")).length;
  const vegetarian = participants.filter(
    (participant) =>
      hasRestriction(participant, "vegetariano") || hasRestriction(participant, "vegano"),
  ).length;
  const lactoseFree = participants.filter((participant) =>
    hasRestriction(participant, "sem_lactose"),
  ).length;
  const glutenFree = participants.filter((participant) =>
    hasRestriction(participant, "sem_gluten"),
  ).length;
  const other = participants.filter((participant) => hasRestriction(participant, "outra")).length;

  const restrictions: RestrictionSummary[] = [
    { key: "vegetariano", label: DIETARY_LABELS.vegetariano ?? "Vegetariano", count: vegetarian },
    { key: "vegano", label: DIETARY_LABELS.vegano ?? "Vegano", count: vegan },
    { key: "sem_lactose", label: DIETARY_LABELS.sem_lactose ?? "Sem lactose", count: lactoseFree },
    { key: "sem_gluten", label: DIETARY_LABELS.sem_gluten ?? "Sem glúten", count: glutenFree },
    { key: "outra", label: DIETARY_LABELS.outra ?? "Outra restrição", count: other },
  ];

  const others: OtherRestriction[] = participants
    .filter((participant) => hasRestriction(participant, "outra") && participant.other)
    .map((participant) => ({
      name: participant.fullName,
      detail: (participant.other ?? "").trim(),
    }));

  const estimates: FoodEstimate[] = FOOD_RULES.filter((rule) => selected.includes(rule.key)).map(
    (rule) => {
    let min = 0;
    let max = 0;

    if (total > 0) {
      min = rule.factor !== undefined ? Math.ceil(total * rule.factor) : Math.ceil(total * rule.min);
      max = rule.factor !== undefined ? min : Math.ceil(total * rule.max);
      if (rule.unit === "ml" || rule.unit === "g") {
        min = Math.max(min, rule.min);
        max = Math.max(max, min);
      }
    }

    let restricted: RestrictedEstimate | undefined;
    if (rule.restricted) {
      const count = rule.restricted.restriction === "sem_lactose" ? lactoseFree : glutenFree;
      if (count > 0) {
        const floor = rule.unit === "g" ? 100 : count;
        restricted = {
          label: rule.restricted.label,
          note: rule.restricted.note,
          count,
          min: Math.max(floor, Math.ceil(count * rule.min)),
          max: Math.max(floor, Math.ceil(count * rule.max)),
        };
      }
    }

    return { key: rule.key, label: rule.label, unit: rule.unit, min, max, note: rule.note, restricted };
    },
  );

  return {
    total,
    restrictions,
    others,
    estimates,
    generatedAt,
    hasRestrictedOptions: estimates.some((estimate) => Boolean(estimate.restricted)),
  };
}

function unitSuffix(unit: QuantityUnit): string {
  if (unit === "un") return "un";
  return unit;
}

export function formatQuantityRange(min: number, max: number, unit: QuantityUnit): string {
  const useKg = (unit === "g" || unit === "ml") && max >= 1000;
  const divisor = useKg ? 1000 : 1;
  const suffix = useKg ? (unit === "g" ? "kg" : "L") : unitSuffix(unit);

  const format = (value: number): string => {
    if (useKg) {
      return (value / divisor).toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    }
    return value.toLocaleString("pt-BR");
  };

  if (min === max) {
    return `${format(min)} ${suffix}`;
  }
  return `${format(min)}–${format(max)} ${suffix}`;
}
