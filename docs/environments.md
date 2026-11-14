# Ambientes e operação

## Matriz

| Ambiente | Aplicação | Banco/Auth | Origem do deploy | Dados |
|---|---|---|---|---|
| Local | `next dev` (porta 3000) | projeto `confconf-dev` (ou Supabase local, com Docker) | manual | fictícios |
| Teste | Vercel Preview | projeto `confconf-dev` | merge em `develop` | fictícios; reset permitido |
| Produção | Vercel Production | projeto `confconf-prod` | merge em `main` + migração | reais |

Região padrão dos projetos: `sa-east-1` (São Paulo).

## Projetos Supabase

| Nome | Uso | Observação |
|---|---|---|
| `confconf-dev` | desenvolvimento e testes | pode ser resetado; seed fictício |
| `confconf-prod` | produção | nunca resetar; backup conforme plano |

Configuração de Auth aplicada em ambos (via Management API no M0):

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
- [ ] Projetos `confconf-dev` e `confconf-prod` criados
- [ ] Auth configurado nos dois projetos
- [ ] Migrações aplicadas nos dois projetos
- [ ] Admin master criado
- [ ] Secrets do GitHub cadastrados
- [ ] Primeira execução verde do CI
