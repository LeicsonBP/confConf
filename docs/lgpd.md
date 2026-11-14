# LGPD e privacidade — confConf

Documento operacional que acompanha a página pública `/privacidade`.

## Papéis

- **Controlador:** quem organiza a confraternização (decide finalidade, convites e exclusão).
- **Operador:** confConf (mantém aplicação, banco e autenticação).
- **Suboperadores:** Supabase (Postgres/Auth) e Vercel (hospedagem), com acesso restrito.

## Inventário de dados

| Dado | Onde fica | Finalidade | Visibilidade |
|---|---|---|---|
| Nome completo, nascimento, usuário | `auth.users` + `public.profiles` | Identificação e acesso | Admin do evento; o próprio participante |
| Hash da senha | GoTrue (`auth.users.encrypted_password`) | Autenticação | Ninguém (hash) |
| Restrições alimentares | `event_participants` | Planejamento alimentar e amigo secreto | Admin do evento; o próprio participante |
| Lista de desejos | `wishlist_items` | Presente do amigo secreto | O próprio participante; quem o tirou após o sorteio |
| Relatos de problema | `problem_reports` | Suporte | Admin do evento; autor |
| Auditoria | `audit_log` | Segurança e rastreabilidade | Admin (sem conteúdo sensível) |
| Convites | `invites` (hash + ciphertext) | Entrada no evento | Admin; o token em si é do convite |

Sem anúncios, analytics de terceiros, venda de dados ou cookies de rastreamento. Sessão via cookie httpOnly do Supabase.

## Retenção e exclusão

- Dados vivem enquanto o evento existir.
- **Remover participante:** apaga a conta (`auth.users`), o perfil e os vínculos; a pessoa perde o acesso e não aparece na recuperação (D-23).
- **Excluir evento:** apaga em cascata participantes, convites, pares, listas e relatos, além das contas dos participantes (exceto admin).
- Contas sem participação são consideradas órfãs e removidas.
- Tokens de convite: revogação imediata; expiração opcional.

## Direitos dos titulares

Acesso e correção: o participante vê o próprio perfil e ajusta as restrições enquanto o evento permite. Correção de nome/usuário/nascimento é feita pelo organizador (não há edição pelo participante, D-19). Exclusão: solicitada ao organizador, que usa "Remover". Dúvidas sobre a plataforma: contato do organizador do evento.

## Segurança

- RLS em todas as tabelas; `service_role` apenas em rotas de recuperação no servidor.
- Senhas com hash no GoTrue; PIN 4–8 normalizado para 6 no cadastro.
- Convites com hash SHA-256 e ciphertext AES-256-GCM (`APP_SECRET`).
- Captcha aritmético próprio e throttle de recuperação (10/15 min por IP, reset no sucesso).
- Auditoria append-only de ações administrativas.
- Cabeçalhos e isolamento padrão da Vercel/Supabase; nenhum dado pessoal em logs de aplicação.

## Incidentes

Seguir o runbook de `docs/environments.md`: revogar tokens de acesso, rotacionar `APP_SECRET`/senha do admin, revisar `audit_log` e comunicar os organizadores afetados.
