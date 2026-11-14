import { describe, expect, it } from "vitest";
import { ADMIN_LOGIN_EMAIL, resolveAdminIdentifier } from "./admin-login";

describe("resolveAdminIdentifier", () => {
  it("mapeia o usuário admin para o e-mail interno", () => {
    expect(resolveAdminIdentifier("admin")).toBe(ADMIN_LOGIN_EMAIL);
    expect(resolveAdminIdentifier("  ADMIN  ")).toBe(ADMIN_LOGIN_EMAIL);
  });

  it("aceita o e-mail interno", () => {
    expect(resolveAdminIdentifier("admin@confconf.invalid")).toBe(ADMIN_LOGIN_EMAIL);
  });

  it("recusa qualquer outro identificador", () => {
    expect(resolveAdminIdentifier("")).toBeNull();
    expect(resolveAdminIdentifier("   ")).toBeNull();
    expect(resolveAdminIdentifier("maria")).toBeNull();
    expect(resolveAdminIdentifier("admin@outro.com")).toBeNull();
  });
});
