import { z } from "zod";

export const WISHLIST_PRIORITIES = [
  { value: 1, label: "Alta" },
  { value: 2, label: "Média" },
  { value: 3, label: "Baixa" },
] as const;

export const wishlistItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Dê um nome ao presente.")
    .max(120, "O nome do presente aceita até 120 caracteres."),
  notes: z.string().trim().max(500, "As observações aceitam até 500 caracteres."),
  url: z
    .string()
    .trim()
    .max(500, "O link aceita até 500 caracteres.")
    .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), {
      message: "O link deve começar com http:// ou https://.",
    }),
  priority: z.coerce
    .number()
    .int("Prioridade inválida.")
    .min(1, "Prioridade inválida.")
    .max(3, "Prioridade inválida."),
});

export type WishlistItemInput = z.infer<typeof wishlistItemSchema>;

export function priorityLabel(priority: number): string {
  return WISHLIST_PRIORITIES.find((option) => option.value === priority)?.label ?? "Média";
}
