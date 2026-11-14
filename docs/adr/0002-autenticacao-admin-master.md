# ADR-0002: Autenticação do administrador master

- **Status:** aceito
- **Data:** 2026-11-14
- **Decisores:** cliente (D-04, login `admin`) e agente

## Contexto

O portal administrativo tem **um único** administrador master, sem cadastro público. O GoTrue (Supabase Auth) exige e-mail ou telefone como identificador, mas o cliente quer entrar com o usuário `admin`. A senha não pode existir no código-fonte.

## Decisão

1. O administrador é um usuário do **Supabase Auth** com o e-mail interno `admin@confconf.invalid` (TLD reservado, não entregável).
2. O formulário de login aceita o usuário **`admin`** ou o e-mail interno e o mapeia para esse e-mail (`resolveAdminIdentifier`).
3. A **senha fica somente no GoTrue**, armazenada como hash em `auth.users` — nunca em código, `.env` ou migration. O único lugar fora do banco com a senha em claro é o arquivo local `.ops/admin-credentials.confconf.txt`, ignorado pelo git.
4. O login exige **captcha aritmético assinado** (HMAC com `APP_SECRET`), validado no servidor.
5. O limite de tentativas de login é delegado aos **rate limits do GoTrue** (por IP), complementados pelo captcha. O throttle próprio em banco fica reservado ao fluxo de recuperação (M2), onde o endpoint usa `service_role`.
6. A allowlist de administradores fica em `public.admin_users` e é consultada por `private.is_admin()` (security definer). A aplicação nunca lê `admin_users` diretamente.
7. Após autenticar, a sessão só é aceita se `am_i_admin()` retornar verdadeiro; caso contrário, o login é desfeito e a mensagem é genérica.

## Alternativas consideradas

| Alternativa | Motivo do descarte |
|---|---|
| Autenticação própria com hash em `profiles` | Duplicaria sessão, hash, lockout e rate limit; risco maior que o GoTrue |
| Login só por e-mail | Contraria o pedido do cliente de usar o usuário `admin` |
| MFA/TOTP obrigatório agora | Fica como opção (O-01) no M6; não bloqueia o MVP |

## Consequências

- **Positivas:** credencial gerenciada pelo GoTrue (hash, rotação de sessão, rate limit), sem segredo no repositório.
- **Negativas:** existe um e-mail interno artificial que precisa ser lembrado; o usuário `admin` é fixo no código (identificador, não segredo).
- Revisar se o cliente quiser mais de um administrador.
