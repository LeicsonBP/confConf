import { describe, expect, it } from "vitest";
import { priorityLabel, wishlistItemSchema } from "./wishlist-item";

describe("wishlistItemSchema", () => {
  const base = { title: "Fone de ouvido", notes: "", url: "", priority: 2 };

  it("aceita item válido", () => {
    expect(wishlistItemSchema.safeParse(base).success).toBe(true);
    expect(
      wishlistItemSchema.safeParse({
        ...base,
        notes: "Qualquer cor",
        url: "https://loja.example.com/fone",
        priority: "3",
      }).success,
    ).toBe(true);
  });

  it("recusa título vazio e prioridade inválida", () => {
    expect(wishlistItemSchema.safeParse({ ...base, title: "  " }).success).toBe(false);
    expect(wishlistItemSchema.safeParse({ ...base, priority: 0 }).success).toBe(false);
    expect(wishlistItemSchema.safeParse({ ...base, priority: 4 }).success).toBe(false);
    expect(wishlistItemSchema.safeParse({ ...base, priority: "x" }).success).toBe(false);
  });

  it("valida o link quando informado", () => {
    expect(wishlistItemSchema.safeParse({ ...base, url: "ftp://x" }).success).toBe(false);
    expect(wishlistItemSchema.safeParse({ ...base, url: "javascript:alert(1)" }).success).toBe(false);
    expect(wishlistItemSchema.safeParse({ ...base, url: "https://ok.example" }).success).toBe(true);
  });
});

describe("priorityLabel", () => {
  it("rotula prioridades", () => {
    expect(priorityLabel(1)).toBe("Alta");
    expect(priorityLabel(2)).toBe("Média");
    expect(priorityLabel(3)).toBe("Baixa");
    expect(priorityLabel(9)).toBe("Média");
  });
});
