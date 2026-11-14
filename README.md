# confConf

Plataforma web para organizar **confraternizações** e **amigos secretos**, com portal administrativo para quem organiza e portal individual para os convidados.

O produto tem identidade visual própria — ingresso/talão retrô, papel kraft, carimbo e tipografia de cartaz — e não usa biblioteca de componentes pronta.

## Status

- **Fase 1 (planejamento e arquitetura):** concluída — veja [`implementation_plan.md`](./implementation_plan.md).
- **Fase 2 (implementação):** em andamento, marco **M0** (fundação).

## Stack

| Camada | Tecnologia |
|---|---|
| Aplicação | Next.js 16 (App Router) + React 19 + TypeScript strict |
| Estilo | Tailwind CSS v4 + design system próprio (`src/design-system`) |
| Banco e autenticação | Supabase (Postgres + RLS + GoTrue) |
| Deploy | Vercel (produção e preview) |
| Testes | Vitest, Testing Library, pgTAP (Supabase local) e Playwright |
| CI | GitHub Actions |

## Como rodar

Pré-requisitos: Node 22+ e npm.

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase
npm run dev
```

Aplicação em `http://localhost:3000`. Healthcheck em `GET /api/health`.

### Variáveis de ambiente

| Variável | Onde usar | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador + servidor | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | navegador + servidor | chave pública (protegida pela RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **somente servidor** | nunca prefixar com `NEXT_PUBLIC_` |
| `APP_SECRET` | servidor | HMAC do captcha e do cookie de recuperação |
| `NEXT_PUBLIC_APP_URL` | navegador + servidor | URL base da aplicação |

## Scripts

| Comando | Função |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e execução de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sem emitir |
| `npm test` / `npm run test:coverage` | testes unitários |
| `npm run db:start` / `db:reset` / `db:test` | Supabase local (exige Docker) |
| `npm run db:types` | regenerar tipos do banco |
| `npm run e2e` | Playwright (a partir do M2) |

> Sem Docker na máquina, o desenvolvimento usa o projeto Supabase de teste (`confconf-dev`). O CI usa Supabase local nos runners do GitHub.

## Estrutura

```
src/
├── app/                 # rotas (App Router)
├── modules/             # domínio por assunto (auth, events, invites, draw, ...)
├── lib/supabase/        # clientes browser, server e admin
├── design-system/       # tokens e componentes visuais
└── shared/              # erros, validação e utilitários
supabase/                # migrações, seed e testes pgTAP
proxy.ts                 # renovação de sessão (novo nome do middleware no Next 16)
```

## Ambientes e branches

| Branch | Ambiente | Banco |
|---|---|---|
| `feature/*`, `fix/*` | PR | — |
| `develop` | **teste** (Vercel Preview) | `confconf-dev` |
| `main` | **produção** (Vercel Production) | `confconf-prod` |

Nenhum merge em `main` sem CI verde. Detalhes em [`docs/environments.md`](./docs/environments.md) e no guia [`docs/deploy-vercel.md`](./docs/deploy-vercel.md).

## Documentação

- [`implementation_plan.md`](./implementation_plan.md) — plano da Fase 1, decisões, RLS e critérios de aceite
- [`docs/environments.md`](./docs/environments.md) — ambientes, variáveis e operação
- [`docs/deploy-vercel.md`](./docs/deploy-vercel.md) — importação e deploy na Vercel

## Licença

Projeto privado; todos os direitos reservados.
