import { describe, expect, it } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  fromBase64Url,
  hmacSha256,
  safeEqual,
  sha256Hex,
  toBase64Url,
} from "./index";

const SECRET = "segredo-de-teste-com-32-caracteres-ok";

describe("crypto", () => {
  it("gera sha256 estável", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("assina e valida com HMAC", () => {
    const signature = hmacSha256("payload", SECRET);
    expect(safeEqual(signature, hmacSha256("payload", SECRET))).toBe(true);
    expect(safeEqual(signature, hmacSha256("payload2", SECRET))).toBe(false);
    expect(safeEqual(signature, hmacSha256("payload", "outro-segredo-456"))).toBe(false);
  });

  it("faz round-trip de base64url", () => {
    const original = Buffer.from("confConf-íntegro", "utf8");
    const encoded = toBase64Url(original);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(fromBase64Url(encoded).toString("utf8")).toBe("confConf-íntegro");
  });

  it("cifra e decifra um segredo", () => {
    const encrypted = encryptSecret("token-do-convite", SECRET);
    expect(encrypted.split(".")).toHaveLength(3);
    expect(encrypted).not.toContain("token-do-convite");
    expect(decryptSecret(encrypted, SECRET)).toBe("token-do-convite");
  });

  it("recusa payload adulterado ou com outro segredo", () => {
    const encrypted = encryptSecret("token-do-convite", SECRET);
    expect(decryptSecret(`${encrypted}x`, SECRET)).toBeNull();
    expect(decryptSecret(encrypted, "outro-segredo-diferente-123")).toBeNull();
    expect(decryptSecret("lixo", SECRET)).toBeNull();
    expect(decryptSecret("a.b", SECRET)).toBeNull();
  });
});
