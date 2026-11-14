/** E-mail interno do administrador no Supabase Auth (não é usado para envio). */
export const ADMIN_LOGIN_EMAIL = "admin@confconf.invalid";

/** Nome de usuário exibido e aceito no formulário de login. */
export const ADMIN_USERNAME = "admin";

/**
 * O GoTrue exige e-mail ou telefone, mas o administrador entra com o usuário "admin".
 * Aceitamos o usuário ou o e-mail interno e devolvemos o e-mail para o GoTrue.
 * Qualquer outro valor retorna `null` (erro genérico na tela).
 */
export function resolveAdminIdentifier(identifier: string): string | null {
  const value = identifier.trim().toLowerCase();
  if (!value) return null;
  if (value === ADMIN_USERNAME || value === ADMIN_LOGIN_EMAIL) {
    return ADMIN_LOGIN_EMAIL;
  }
  return null;
}
