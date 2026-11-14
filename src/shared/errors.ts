export type AppErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal";

const HTTP_STATUS: Record<AppErrorCode, number> = {
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
};

/** Erro de domínio com código estável, mensagem em pt-BR e status HTTP. */
export class AppError extends Error {
  readonly httpStatus: number;
  readonly details?: unknown;

  constructor(
    readonly code: AppErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.httpStatus = HTTP_STATUS[code];
    this.details = details;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/** Converte qualquer falha em um AppError, sem vazar stack trace para o cliente. */
export function toAppError(value: unknown): AppError {
  if (isAppError(value)) {
    return value;
  }
  return new AppError("internal", "Não foi possível concluir a operação.", value);
}
