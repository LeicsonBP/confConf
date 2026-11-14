export const DIETARY_OPTIONS = [
  { value: "vegetariano", label: "Vegetariano(a)" },
  { value: "vegano", label: "Vegano(a)" },
  { value: "sem_lactose", label: "Intolerante à lactose" },
  { value: "sem_gluten", label: "Celíaco(a)" },
  { value: "outra", label: "Outra restrição" },
] as const;

export type DietaryValue = (typeof DIETARY_OPTIONS)[number]["value"];

export const DIETARY_VALUES: string[] = DIETARY_OPTIONS.map((option) => option.value);

export const DIETARY_LABELS: Record<string, string> = Object.fromEntries(
  DIETARY_OPTIONS.map((option) => [option.value, option.label]),
);

export function labelForRestriction(value: string): string {
  return DIETARY_LABELS[value] ?? value;
}
