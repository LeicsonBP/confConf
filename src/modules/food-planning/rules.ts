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
  quantity: number;
  display: string;
}

export interface FoodEstimate {
  key: string;
  label: string;
  unit: QuantityUnit;
  quantity: number;
  note: string;
  /** Resultado já na unidade de compra (garrafas, sacos, unidades). */
  display: string;
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
  /** Consumo por pessoa (média de referência). */
  perPerson: number;
  note: string;
  /** Multiplicador direto (ex.: descartáveis = 1,2 × pessoas). */
  factor?: number;
  /** Quando true, não arredonda para múltiplo de 5. */
  precise?: boolean;
  restricted?: {
    restriction: "sem_lactose" | "sem_gluten";
    label: string;
    note: string;
  };
}

const BOTTLE_SIZES = [
  { ml: 500, label: "500 ml" },
  { ml: 1000, label: "1 L" },
  { ml: 1500, label: "1,5 L" },
  { ml: 2000, label: "2 L" },
] as const;

const ICE_BAG_GRAMS = 5000;/**
 * Médias por pessoa baseadas em referências de festas (M5, D-25):
 * salgados 12–15 quando são a comida principal, doces 5–6, bolo ~100 g,
 * refrigerante ~400 ml, água ~500 ml, gelo ~500 g.
 * Resultados sempre arredondados para cima em múltiplos de 5.
 */
export const FOOD_RULES: FoodRule[] = [
  {
    key: "salgados",
    label: "Salgados",
    unit: "un",
    perPerson: 12,
    note: "Base do cardápio; inclui assados e fritos",
  },
  {
    key: "doces",
    label: "Doces",
    unit: "un",
    perPerson: 5,
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
    perPerson: 100,
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
    perPerson: 400,
    note: "Incluir zero",
  },
  { key: "agua", label: "Água", unit: "ml", perPerson: 500, note: "" },
  { key: "gelo", label: "Gelo", unit: "g", perPerson: 500, note: "" },
  {
    key: "descartaveis",
    label: "Descartáveis",
    unit: "jogos",
    perPerson: 0,
    factor: 1.2,
    precise: true,
    note: "Pratos, copos e guardanapos (1,2 × pessoas, sem arredondamento)",
  },
];

export const FOOD_KEYS: string[] = FOOD_RULES.map((rule) => rule.key);

export function roundUpToFive(value: number): number {
  if (value <= 0) return 0;
  return Math.ceil(value / 5) * 5;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

interface BottleChoice {
  count: number;
  label: string;
}

/**
 * Menor embalagem que atende: abaixo de 2 L usa uma garrafa do tamanho
 * imediatamente acima; a partir de 2 L usa garrafas de 2 L.
 */
function chooseBottle(totalMl: number): BottleChoice | null {
  if (totalMl <= 0) return null;

  if (totalMl < 2000) {
    const size = BOTTLE_SIZES.find((option) => option.ml >= totalMl) ?? {
      ml: 500,
      label: "500 ml",
    };
    return { count: 1, label: size.label };
  }

  const size = BOTTLE_SIZES[3] ?? { ml: 2000, label: "2 L" };
  return { count: Math.ceil(totalMl / size.ml), label: size.label };
}

function displayFor(key: string, quantity: number): string {
  switch (key) {
    case "salgados":
      return plural(quantity, "salgado", "salgados");
    case "doces":
      return plural(quantity, "doce", "doces");
    case "bolo":
      return formatQuantity(quantity, "g");
    case "refrigerante":
    case "agua": {
      const bottle = chooseBottle(quantity);
      if (!bottle) return "0 garrafas";
      return `${plural(bottle.count, "garrafa", "garrafas")} de ${bottle.label}`;
    }
    case "gelo": {
      const bags = Math.ceil(quantity / ICE_BAG_GRAMS);
      return `${plural(bags, "saco", "sacos")} de 5 kg`;
    }
    case "descartaveis":
      return plural(quantity, "jogo", "jogos");
    default:
      return formatQuantity(quantity, "un");
  }
}

function restrictedDisplayFor(key: string, quantity: number): string {
  if (key === "doces") return plural(quantity, "doce", "doces");
  if (key === "bolo") return formatQuantity(quantity, "g");
  return formatQuantity(quantity, "un");
}

function hasRestriction(participant: FoodParticipant, value: string): boolean {
  return participant.restrictions.includes(value);
}

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
      const base = rule.factor !== undefined ? total * rule.factor : total * rule.perPerson;
      const quantity =
        total === 0 ? 0 : rule.precise ? Math.ceil(base) : roundUpToFive(base);

      let restricted: RestrictedEstimate | undefined;
      if (rule.restricted) {
        const count = rule.restricted.restriction === "sem_lactose" ? lactoseFree : glutenFree;
        if (count > 0) {
          const perRestricted = rule.perPerson > 0 ? rule.perPerson : 1;
          const restrictedQuantity = roundUpToFive(Math.max(count * perRestricted, count));
          restricted = {
            label: rule.restricted.label,
            note: rule.restricted.note,
            count,
            quantity: restrictedQuantity,
            display: restrictedDisplayFor(rule.key, restrictedQuantity),
          };
        }
      }

      return {
        key: rule.key,
        label: rule.label,
        unit: rule.unit,
        quantity,
        note: rule.note,
        display: displayFor(rule.key, quantity),
        restricted,
      };
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

export function formatQuantity(quantity: number, unit: QuantityUnit): string {
  const useKg = (unit === "g" || unit === "ml") && quantity >= 1000;

  if (useKg) {
    const formatted = (quantity / 1000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${formatted} ${unit === "g" ? "kg" : "L"}`;
  }

  return `${quantity.toLocaleString("pt-BR")} ${unit}`;
}
