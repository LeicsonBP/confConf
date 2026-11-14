## O que muda

<!-- Descreva o comportamento alterado, não só os arquivos tocados. -->

## Como testar

<!-- Passo a passo manual e/ou comandos executados. -->

## Checklist — rotina de qualidade obrigatória

- [ ] Arquitetura e organização do código revisadas
- [ ] Aderência a padrões e convenções verificada
- [ ] Testes pertinentes executados (`npm run lint`, `typecheck`, `test`)
- [ ] Testes unitários criados ou atualizados
- [ ] Documentação existente revisada
- [ ] Documentação da alteração atualizada
- [ ] Impactos em funcionalidades existentes verificados
- [ ] Decisão técnica relevante registrada em ADR ou em `implementation_plan.md`

## Segurança

- [ ] Nenhum segredo, token ou dado real incluído no repositório
- [ ] Mudanças de RLS/migração testadas no Supabase local
- [ ] `service_role` continua restrita ao servidor (nenhum `NEXT_PUBLIC_` com chave privada)

## Migrações

- [ ] Sem migração? Marque N/A
- [ ] Migração nova é forward-only (nenhuma migração aplicada foi editada)
- [ ] Ordem e rollback documentados no PR
