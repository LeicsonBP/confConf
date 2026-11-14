export const REPORT_CATEGORIES = [
  { value: "recebi_eu_mesmo", label: "Recebi o meu próprio nome no sorteio" },
  { value: "nao_recebi", label: "Ainda não recebi/visualizei meu amigo secreto" },
  { value: "outro", label: "Outro problema" },
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]["value"];

export const REPORT_VALUES: string[] = REPORT_CATEGORIES.map((item) => item.value);

export const REPORT_STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto",
  em_analise: "Em análise",
  resolvido: "Resolvido",
  descartado: "Descartado",
};

export function reportCategoryLabel(value: string): string {
  return REPORT_CATEGORIES.find((item) => item.value === value)?.label ?? value;
}

export function reportStatusLabel(value: string): string {
  return REPORT_STATUS_LABELS[value] ?? value;
}
