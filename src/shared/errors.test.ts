import { describe, expect, it } from "vitest";
import { AppError, isAppError, toAppError } from "./errors";

describe("AppError", () => {
  it("mapeia cada código para o status HTTP esperado", () => {
    expect(new AppError("validation_error", "x").httpStatus).toBe(400);
    expect(new AppError("unauthorized", "x").httpStatus).toBe(401);
    expect(new AppError("forbidden", "x").httpStatus).toBe(403);
    expect(new AppError("not_found", "x").httpStatus).toBe(404);
    expect(new AppError("conflict", "x").httpStatus).toBe(409);
    expect(new AppError("rate_limited", "x").httpStatus).toBe(429);
    expect(new AppError("internal", "x").httpStatus).toBe(500);
  });

  it("preserva código e detalhes", () => {
    const error = new AppError("conflict", "já existe", { field: "username" });
    expect(error.code).toBe("conflict");
    expect(error.details).toEqual({ field: "username" });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
  });
});

describe("toAppError", () => {
  it("devolve o próprio AppError", () => {
    const error = new AppError("forbidden", "sem acesso");
    expect(toAppError(error)).toBe(error);
    expect(isAppError(error)).toBe(true);
  });

  it("embrulha falhas desconhecidas como internal", () => {
    const wrapped = toAppError(new Error("boom"));
    expect(wrapped.code).toBe("internal");
    expect(wrapped.httpStatus).toBe(500);
    expect(wrapped.message).toBe("Não foi possível concluir a operação.");
    expect(wrapped.details).toBeInstanceOf(Error);
  });

  it("trata valores que não são Error", () => {
    expect(toAppError("falha").code).toBe("internal");
    expect(toAppError(undefined).code).toBe("internal");
    expect(isAppError("falha")).toBe(false);
  });
});
