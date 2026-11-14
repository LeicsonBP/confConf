import { describe, expect, it } from "vitest";
import { hmacSha256, fromBase64Url, safeEqual, sha256Hex, toBase64Url } from "./index";

describe("crypto", () => {
  it("gera sha256 estável", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("assina e valida com HMAC", () => {
    const signature = hmacSha256("payload", "segredo-bem-longo-123");
    expect(safeEqual(signature, hmacSha256("payload", "segredo-bem-longo-123"))).toBe(true);
    expect(safeEqual(signature, hmacSha256("payload2", "segredo-bem-longo-123"))).toBe(false);
    expect(safeEqual(signature, hmacSha256("payload", "outro-segredo-456"))).toBe(false);
  });

  it("faz round-trip de base64url", () => {
    const original = Buffer.from("confConf-íntegro", "utf8");
    const encoded = toBase64Url(original);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(fromBase64Url(encoded).toString("utf8")).toBe("confConf-íntegro");
  });
});
