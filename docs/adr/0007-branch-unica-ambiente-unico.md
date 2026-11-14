# ADR-0007: Branch única e ambiente único (D-14)

- **Status:** aceito (substitui parcialmente D-12)
- **Data:** 2026-11-14
- **Decisores:** cliente

## Contexto

O plano original previa `main` (produção) e `develop` (teste), com dois projetos Supabase (`confconf-dev` e `confconf-prod`). O Supabase Free permite 2 projetos e ambos já estavam em uso na conta do cliente.

## Decisão

1. **Ambiente único**: um projeto Supabase (`confConf`) para desenvolvimento, testes manuais e produção.
2. **Branch única**: todo trabalho acontece na `main`; não existe `develop`.
3. A validação de banco acontece no **Supabase local** dentro do CI (`db-test.yml`) antes de qualquer push ou merge.
4. A proteção da `main` mantém os checks `ci` e `db-test` obrigatórios e bloqueia force push; como há um único operador, o push direto é permitido.
5. Migrações são aplicadas pela Management API (`npm run ops:provision`) ou pelo CLI quando a senha do banco está configurada.

## Alternativas consideradas

| Alternativa | Motivo do descarte |
|---|---|
| Manter dois ambientes | Exigiria um terceiro projeto Supabase ou apagar um já em uso |
| `develop` sem banco separado | Não isola dados e adiciona etapas sem ganho real |

## Consequências

- **Positivas:** fluxo mais simples e custo zero; uma única fonte de dados.
- **Negativas (aceitas em R-11):** sem ambiente isolado, código e migração chegam juntos na produção; previews de PR, se usados, compartilham o banco; a barreira é o CI com Supabase local.
- Se o projeto crescer, reabrir esta decisão e migrar para Supabase Pro com dois projetos.
