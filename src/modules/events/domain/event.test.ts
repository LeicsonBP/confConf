import { describe, expect, it } from "vitest";
import {
  eventInputSchema,
  formatCentsToBrl,
  formatEventDate,
  fromIsoToLocalDateTime,
  parseBrlToCents,
  toEventRow,
  toSaoPauloIso,
} from "./event";

describe("parseBrlToCents", () => {
  it("converte valores comuns", () => {
    expect(parseBrlToCents("150")).toBe(15000);
    expect(parseBrlToCents("150,00")).toBe(15000);
    expect(parseBrlToCents("1.234,56")).toBe(123456);
    expect(parseBrlToCents("R$ 99,90")).toBe(9990);
    expect(parseBrlToCents("0,05")).toBe(5);
  });

  it("trata vazio como nulo", () => {
    expect(parseBrlToCents("")).toBeNull();
    expect(parseBrlToCents("   ")).toBeNull();
  });

  it("recusa formatos inválidos", () => {
    expect(() => parseBrlToCents("abc")).toThrow();
    expect(() => parseBrlToCents("150,999")).toThrow();
    expect(() => parseBrlToCents("1,2,3")).toThrow();
  });
});

describe("formatCentsToBrl", () => {
  it("formata centavos", () => {
    expect(formatCentsToBrl(15000)).toBe("150,00");
    expect(formatCentsToBrl(5)).toBe("0,05");
    expect(formatCentsToBrl(null)).toBe("");
  });
});

describe("datas", () => {
  it("converte datetime-local de São Paulo para ISO UTC", () => {
    expect(toSaoPauloIso("2026-12-20T19:30")).toBe("2026-12-20T22:30:00.000Z");
  });

  it("recusa data inválida", () => {
    expect(() => toSaoPauloIso("20/12/2026 19:30")).toThrow();
    expect(() => toSaoPauloIso("2026-13-40T99:99")).toThrow();
    expect(() => toSaoPauloIso("2026-13-01T10:00")).toThrow();
  });

  it("converte ISO de volta para datetime-local", () => {
    expect(fromIsoToLocalDateTime("2026-12-20T22:30:00.000Z")).toBe("2026-12-20T19:30");
  });

  it("formata a data para exibição", () => {
    expect(formatEventDate("2026-12-20T22:30:00.000Z")).toContain("20/12/2026");
    expect(formatEventDate("2026-12-20T22:30:00.000Z")).toContain("19:30");
  });
});

describe("eventInputSchema", () => {
  const base = {
    name: "Confraternização de fim de ano",
    description: "",
    location: "",
    startsAt: "2026-12-20T19:30",
    maxGift: "",
    extraInfo: "",
    hasSecretSanta: true,
  };

  it("aceita entrada válida", () => {
    expect(eventInputSchema.safeParse(base).success).toBe(true);
  });

  it("recusa nome curto e data malformada", () => {
    expect(eventInputSchema.safeParse({ ...base, name: "ab" }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...base, startsAt: "2026-12-20" }).success).toBe(false);
  });
});

describe("toEventRow", () => {
  const input = {
    name: "Confraternização de fim de ano",
    description: "",
    location: "Salão",
    startsAt: "2026-12-20T19:30",
    maxGift: "150,00",
    extraInfo: "",
    hasSecretSanta: false,
  };

  it("normaliza campos opcionais e converte valores", () => {
    const row = toEventRow(input);
    expect(row).toEqual({
      name: "Confraternização de fim de ano",
      description: null,
      location: "Salão",
      starts_at: "2026-12-20T22:30:00.000Z",
      timezone: "America/Sao_Paulo",
      max_gift_cents: 15000,
      extra_info: null,
      has_secret_santa: false,
    });
  });

  it("aceita presente vazio", () => {
    expect(toEventRow({ ...input, maxGift: "" }).max_gift_cents).toBeNull();
  });

  it("normaliza local vazio", () => {
    expect(toEventRow({ ...input, location: "" }).location).toBeNull();
  });

  it("recusa presente acima do limite", () => {
    expect(() => toEventRow({ ...input, maxGift: "2.000.000,00" })).toThrow();
  });
});
