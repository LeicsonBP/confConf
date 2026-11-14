# Ambientes e operação

## Matriz

| Ambiente | Aplicação | Banco/Auth | Origem do deploy | Dados |
|---|---|---|---|---|
| Local | `next dev` (porta 3000) | projeto `confconf-dev` (ou Supabase local, com Docker) | manual | fictícios |
| Teste | Vercel Preview | projeto `confconf-dev` | merge em `develop` | fictícios; reset permitido |
| Produção | Vercel Production | projeto `confconf-prod` (a criar no M7) | merge em `main` + migração | reais |

## Projetos Supabase

| Nome | Ref | Região | Uso | Observação |
|---|---|---|---|---|
| `confconf-dev` | `spfciwfphtvkadyrhkiu` | `us-east-1` | desenvolvimento e testes | projeto reaproveitado (criado vazio pelo cliente); pode ser resetado |
| `confconf-prod` | — | `sa-east-1` (previsto) | produção | criado no release (M7); nunca resetar |

> **Por que o ambiente de teste está em `us-east-1`:** o projeto existente foi reaproveitado a pedido do cliente (`confConf`, criado vazio, sem tabelas). A produção será criada em `sa-east-1`, onde a latência importa.

Estado do `confconf-dev` em 14/11/2026:

- migrações aplicadas via **Management API**, porque a senha do banco foi definida no painel na criação do projeto e não é conhecida pelo agente;
- para voltar a usar o CLI (`npx supabase db push --remote`), redefina a senha em *Project Settings → Database* e configure `SUPABASE_DB_PASSWORD`;
- Auth configurado via Management API (lista abaixo);
- admin master criado (`admin@confconf.invalid`), credencial em `.ops/admin-credentials.dev.txt`;
- smoke test local validado: `GET /api/health` 200 e home renderizada com o banco real.

Configuração de Auth aplicada:

- confirmação de e-mail desligada;
- cadastro aberto (o fluxo de convite controla a entrada de dados);
- senha mínima de 6 caracteres;
- exigência de classes de caractere desligada;
- proteção de senha vazada (HIBP) desligada;
- captcha nativo desligado (usamos o captcha aritmético próprio).

## Variáveis de ambiente

### Vercel (Production)

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto `confconf-prod` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave anon do projeto `confconf-prod` |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service role do projeto `confconf-prod` |
| `APP_SECRET` | segredo aleatório de 32+ bytes (HMAC) |
| `NEXT_PUBLIC_APP_URL` | URL pública de produção |

### Vercel (Preview e Development)

As mesmas variáveis, apontando para `confconf-dev`.

### Local (`.env.local`)

Use as chaves de `confconf-dev`. Nunca commitar `.env.local` (já ignorado pelo git).

## Segredos e guardrails

- `SUPABASE_SERVICE_ROLE_KEY` nunca com prefixo `NEXT_PUBLIC_`; uso restrito ao endpoint de recuperação.
- `APP_SECRET` é usado para assinar o captcha e o cookie de recuperação.
- Tokens de CLI ficam em arquivo local ignorado (`.ops/`) e nos Secrets do GitHub.
- Rotação: `APP_SECRET` e `service_role` a cada 90 dias ou em caso de suspeita (runbook em `docs/runbook.md`, criado no M6).

## CI/CD

| Workflow | Gatilho | O que faz |
|---|---|---|
| `ci.yml` | PR e push em `develop` | lint, tipos, testes com cobertura e build |
| `db-test.yml` | PR e push em `develop` | Supabase local, migrações, seed e pgTAP |

O deploy da aplicação é feito pela integração GitHub ↔ Vercel (guia em `docs/deploy-vercel.md`).

## Migrações

1. Criar: `npx supabase migration new nome_da_migracao`
2. Aplicar no projeto de teste: `npx supabase db push --project-ref <ref-dev>`
3. Abrir PR para `develop`; o CI valida em Supabase local.
4. No release para `main`, aplicar em produção com `--project-ref <ref-prod>`.

Nunca editar migração já aplicada.

## Provisionamento assistido

O provisionamento dos dois projetos é feito por `scripts/ops/provision.mjs` (`npm run ops:provision`), que:

1. cria (ou reaproveita) `confconf-dev` e `confconf-prod` em `sa-east-1`;
2. aplica a configuração de Auth;
3. aplica as migrações versionadas;
4. cria o administrador master e grava a credencial em `.ops/admin-credentials.<ambiente>.txt`;
5. verifica tabelas, RLS e funções;
6. grava `.ops/dev.env`, `.ops/prod.env` e `.env.local`.

Entrada: `.ops/secrets.env` com `SUPABASE_ACCESS_TOKEN` (e, opcionalmente, `SUPABASE_ORG_ID`, `ADMIN_EMAIL`). Tudo em `.ops/` é ignorado pelo git.

> **Nota do M0:** o provisionamento foi executado com `--only=dev` sobre o projeto existente. A criação de projetos via API falhou porque o token usado é **escopado** (sem permissão de organização). Para criar `confconf-prod` no M7 será necessário um token com `Projects: write` na organização (ou criar o projeto pelo painel). Como a senha do banco não é conhecida, as migrações do ambiente de teste foram aplicadas pela Management API; o CI continua validando tudo no Supabase local.

## Limites do plano gratuito

| Limite | Impacto | Mitigação |
|---|---|---|
| 2 projetos ativos | dev + prod usam todo o limite | não criar projetos extras |
| Pausa por inatividade | produção pode pausar | reativar no dashboard; avaliar Pro na virada |
| Sem backup automático | sem restauração point-in-time | exportar schema/dados periodicamente |
| Vercel Hobby | uso não comercial | reavaliar se o projeto virar produto |

## Checklist do M0

- [x] Repositório com `main` e `develop`
- [x] App Next.js 16 compilando, com lint e testes
- [x] Migração inicial com RLS e helpers
- [x] Workflows de CI e de banco
- [x] Proteções de branch e labels configurados
- [x] Primeira execução verde do CI (lint, tipos, testes, build e pgTAP)
- [x] Ambiente de teste `confconf-dev` criado/reaproveitado e configurado
- [x] Auth configurado no ambiente de teste
- [x] Migrações aplicadas e verificadas no ambiente de teste (pgTAP verde em CI; RLS conferida na nuvem)
- [x] Admin master criado e login validado
- [x] Secrets do GitHub cadastrados (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF_DEV`)
- [ ] Projeto de produção `confconf-prod` (M7, no release)

