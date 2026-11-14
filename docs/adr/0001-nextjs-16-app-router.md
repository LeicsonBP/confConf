# ADR-0001: Next.js 16 com App Router

- **Status:** aceito
- **Data:** 2026-11-14
- **Decisores:** cliente (D-01) e agente

## Contexto

Precisávamos escolher o framework frontend entre Next.js, SvelteKit, Astro e Nuxt, com deploy na Vercel, Supabase como banco/autenticação, identidade visual própria e testes automatizados.

## Decisão

Usar **Next.js 16 com App Router**, React 19, TypeScript strict e Tailwind CSS v4 apenas como camada utilitária sobre tokens próprios.

Consequências práticas:

- renderização no servidor por padrão (Server Components) e Server Actions para mutações;
- `proxy.ts` (novo nome do middleware no Next 16) faz apenas a renovação de sessão do Supabase;
- páginas do painel são `force-dynamic` porque dependem de cookies e do banco;
- rotas dinâmicas recebem `params` como `Promise` (mudança do Next 15/16);
- design system próprio em `src/design-system`, sem biblioteca de componentes pronta.

## Alternativas consideradas

| Alternativa | Motivo do descarte |
|---|---|
| SvelteKit 3 | Melhor DX e bundle, mas integração Supabase menos documentada e ecossistema menor |
| Astro 6 | Excelente para páginas públicas; app autenticado e interativo exige mais costura |
| Nuxt 4 | SSR com Supabase menos maduro e deploy na Vercel inferior ao Next.js |

## Consequências

- **Positivas:** integração oficial com `@supabase/ssr`, deploy nativo na Vercel, maior base de exemplos e ferramental de IA.
- **Negativas:** mais conceitos simultâneos (RSC, Server Actions, proxy) e bundle maior que concorrentes.
- ADR a revisar se o projeto migrar para outro provedor de hospedagem.
