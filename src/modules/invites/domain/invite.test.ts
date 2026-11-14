import { describe, expect, it } from "vitest";
import {
  buildInviteUrl,
  formatInviteUses,
  inviteStatus,
  inviteStatusLabel,
  parseInviteDays,
  parseMaxUses,
} from "./invite";

const now = new Date("2026-11-14T12:00:00.000Z");

function state(overrides: Partial<Parameters<typeof inviteStatus>[0]> = {}) {
  return {
    expiresAt: "2026-12-14T12:00:00.000Z",
    revokedAt: null,
    usedCount: 0,
    maxUses: null,
    ...overrides,
  };
}

describe("inviteStatus", () => {
  it("classifica convites", () => {
    expect(inviteStatus(state(), now)).toBe("ativo");
    expect(inviteStatus(state({ revokedAt: "2026-11-01T00:00:00.000Z" }), now)).toBe("revogado");
    expect(inviteStatus(state({ expiresAt: "2026-11-14T11:59:59.000Z" }), now)).toBe("expirado");
    expect(inviteStatus(state({ maxUses: 3, usedCount: 3 }), now)).toBe("esgotado");
    expect(inviteStatus(state({ maxUses: 3, usedCount: 2 }), now)).toBe("ativo");
  });

  it("trata maxUses nulo como ilimitado", () => {
    expect(inviteStatus(state({ maxUses: null, usedCount: 999 }), now)).toBe("ativo");
  });

  it("rotula o status", () => {
    expect(inviteStatusLabel("ativo")).toBe("Ativo");
    expect(inviteStatusLabel("esgotado")).toBe("Esgotado");
  });
});

describe("formatInviteUses", () => {
  it("mostra usos com e sem limite", () => {
    expect(formatInviteUses(3, 10)).toBe("3 de 10");
    expect(formatInviteUses(42, null)).toBe("42 (ilimitado)");
  });
});

describe("parseInviteDays", () => {
  it("aceita 1 a 365 dias", () => {
    expect(parseInviteDays("30")).toBe(30);
    expect(parseInviteDays("1")).toBe(1);
  });

  it("recusa valores inválidos", () => {
    expect(() => parseInviteDays("0")).toThrow();
    expect(() => parseInviteDays("366")).toThrow();
    expect(() => parseInviteDays("abc")).toThrow();
    expect(() => parseInviteDays("2.5")).toThrow();
  });
});

describe("parseMaxUses", () => {
  it("vazio vira ilimitado", () => {
    expect(parseMaxUses("")).toBeNull();
    expect(parseMaxUses("   ")).toBeNull();
  });

  it("aceita limite válido e recusa inválido", () => {
    expect(parseMaxUses("50")).toBe(50);
    expect(() => parseMaxUses("0")).toThrow();
    expect(() => parseMaxUses("5001")).toThrow();
  });
});

describe("buildInviteUrl", () => {
  it("monta a URL sem barra duplicada", () => {
    expect(buildInviteUrl("https://confconf.vercel.app/", "abc")).toBe(
      "https://confconf.vercel.app/convite/abc",
    );
    expect(buildInviteUrl("http://localhost:3000", "abc")).toBe(
      "http://localhost:3000/convite/abc",
    );
  });
});
