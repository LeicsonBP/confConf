# Ambiente e operação

## Decisão: ambiente único (D-14)

O plano original previa dois ambientes (teste e produção). Em 14/11/2026 o cliente definiu **ambiente único**: o Supabase Free permite 2 projetos e ambos já estão em uso, então não haverá projeto separado de teste. Vale também para o repositório: **sem branch `develop`**.

Consequências aceitas:

- a validação de banco acontece no **Supabase local** dentro do CI (migrações + pgTAP) antes de qualquer push em `main`;
- o deploy da Vercel publica `main` direto em produção;
- previews de PR (se usados) apontam para o **mesmo banco** — nada destrutivo em preview.

## Matriz

| Contexto | Aplicação | Banco | Observação |
|---|---|---|---|
| Local | `next dev` | projeto `confConf` | `.env.local` aponta para o banco real: cuidado com scripts destrutivos |
| CI | GitHub Actions | Supabase local (Docker do runner) | isolado, com seed fictício |
| Produção | Vercel Production (`main`) | projeto `confConf` | dados reais |

## Projeto Supabase

| Nome | Ref | Região | Observação |
|---|---|---|---|
| `confConf` | `spfciwfphtvkadyrhkiu` | `us-east-1` | único ambiente; nunca resetar |

Estado em 14/11/2026:

- Auth configurado via Management API (lista abaixo);
- migrações aplicadas e verificadas: 10 tabelas, RLS em todas, 10 funções em `private`, `am_i_admin` e `bootstrap_admin` em `public`;
- admin master criado (`admin@confconf.invalid`), credencial em `.ops/admin-credentials.confconf.txt`;
- seed fictício aplicado durante o setup e **removido** em seguida, para não misturar dados de demonstração com os reais;
- os tipos TypeScript são gerados do banco real (`npm run db:types`).

**Senha do banco:** o projeto foi criado pelo painel e a senha não é conhecida pelo agente. As migrações foram aplicadas pela **Management API**. Para usar o CLI (`npx supabase db push --remote`), redefina a senha em *Project Settings → Database* e configure `SUPABASE_DB_PASSWORD`.

## Variáveis de ambiente

Vercel (Production **e** Preview usam os mesmos valores, pois há um só banco):

| Variável | Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (somente servidor) |
| `APP_SECRET` | `.ops/app-secret` |
| `NEXT_PUBLIC_APP_URL` | URL pública de produção |

Local: `.env.local` (gerado no setup, ignorado pelo git).

## Segredos e guardrails

- `SUPABASE_SERVICE_ROLE_KEY` nunca com prefixo `NEXT_PUBLIC_`; uso restrito ao endpoint de recuperação.
- `APP_SECRET` assina o captcha e o cookie de recuperação.
- Tokens de CLI ficam em `.ops/` (ignorado) e nos Secrets do GitHub.
- Rotação recomendada a cada 90 dias ou em caso de suspeita.

## CI/CD

| Workflow | Gatilho | O que faz |
|---|---|---|
| `ci.yml` | push e PR em `main` | lint, tipos, testes com cobertura e build |
| `db-test.yml` | push e PR em `main` | Supabase local, migrações, seed e pgTAP |

Deploy: integração GitHub ↔ Vercel (guia em `docs/deploy-vercel.md`).

## Migrações

1. Criar: `npx supabase migration new nome_da_migracao`
2. Validar localmente: `supabase start && supabase db reset && supabase test db` (ou deixar o CI validar no push)
3. Aplicar no banco: `npm run ops:provision` (aplica pela Management API) ou `npx supabase db push --remote` se a senha do banco estiver configurada.

Nunca editar migração já aplicada.

## Limites do plano gratuito

| Limite | Impacto | Mitigação |
|---|---|---|
| 2 projetos ativos | já utilizados pelo cliente | ambiente único (D-14) |
| Pausa por inatividade | o projeto pode pausar | reativar no dashboard; avaliar Pro |
| Sem backup automático | sem restauração point-in-time | exportar schema/dados periodicamente |
| Vercel Hobby | uso não comercial | reavaliar se o projeto virar produto |

## Checklist do M0

- [x] Repositório com `main` (sem `develop`)
- [x] App Next.js 16 compilando, com lint e testes
- [x] Migração inicial com RLS e helpers
- [x] Workflows de CI e de banco
- [x] Proteção de branch e labels configurados
- [x] Primeira execução verde do CI (lint, tipos, testes, build e pgTAP)
- [x] Projeto Supabase `confConf` configurado
- [x] Auth configurado
- [x] Migrações aplicadas e verificadas (RLS conferida na nuvem)
- [x] Admin master criado e login validado
- [x] Secrets do GitHub cadastrados
