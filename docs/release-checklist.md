# Checklist de release — M7

Quem faz o quê: o **cliente** importa o repositório na Vercel e informa a URL; o **agente** opera Supabase/GitHub, aplica migrações, valida o deploy e roda os testes de fumaça.

## Status do release (14/11/2026)

- [x] Deploy em produção: **https://confconf.vercel.app**
- [x] Build da Vercel e CI verdes
- [x] `/api/health` com `status: ok` e `database: ok`
- [x] 7 testes E2E de fumaça contra produção
- [x] Fluxo do admin validado (login, evento, convite, exclusão)
- [x] Fluxo do participante validado (cadastro por convite, login e área)
- [x] `NEXT_PUBLIC_APP_URL` correta (link de convite com o domínio de produção)
- [x] Supabase Auth: Site URL e Redirect URLs configurados
- [x] Senha do admin rotacionada (nova senha em `.ops/admin-credentials.confconf.txt`)
- [x] Monitoramento agendado: GitHub Actions `uptime` a cada 30 minutos
- [x] Dados de teste removidos; evento real do cliente preservado
- [ ] PAT do Supabase rotacionado (ação do cliente no painel)
- [ ] Domínio próprio (opcional)

## 1. Antes de importar

- [ ] CI verde em `main` (workflows `ci` e `db-test`)
- [ ] Migrações aplicadas no Supabase (`npm run ops:provision`)
- [ ] `.ops/confconf.env` com URL, anon key, service role e `APP_SECRET`
- [ ] Admin master funcionando localmente
- [ ] Nenhum segredo versionado (`.ops/` e `.env.local` no `.gitignore`)
- [ ] Rotacionar credenciais que apareceram em conversa (senha do admin e PAT do Supabase) antes de divulgar a URL

## 2. Importar na Vercel (cliente)

1. Vercel → **Add New → Project** → repositório `LeicsonBP/confConf`.
2. Preset **Next.js**; **Production Branch** `main`; Node.js LTS (o CI usa 22).
3. Variáveis em **Production** e **Preview**:

| Variável | Origem |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://spfciwfphtvkadyrhkiu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.ops/confconf.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | `.ops/confconf.env` (somente servidor) |
| `APP_SECRET` | `.ops/confconf.env` (somente servidor) |
| `NEXT_PUBLIC_APP_URL` | URL pública de produção |

4. Deploy e informe a URL ao agente.

Guia detalhado: [`deploy-vercel.md`](./deploy-vercel.md).

## 3. Configurar o Supabase Auth (agente)

- **Site URL** = URL de produção.
- **Redirect URLs**: URL de produção e `http://localhost:3000`.
- Confirmação de e-mail **desligada**; leaked password protection **desligada** (PIN de 4–8 dígitos).
- `service_role` apenas no servidor da Vercel (nunca em `NEXT_PUBLIC_*`).

## 4. Pós-deploy (agente)

- [ ] `GET /api/health` → `{"status":"ok","database":"ok"}` (200)
- [ ] Home, `/admin/entrar`, `/entrar`, `/recuperar`, `/recuperar/usuario` e `/privacidade` abrem
- [ ] Login do admin e criação de confraternização
- [ ] Convite: copiar link, cadastro com captcha e login do participante
- [ ] Sorteio, confirmação, desfazer/refazer e relato
- [ ] Recuperação de senha e recuperação de usuário
- [ ] `E2E_BASE_URL=<url> npm run e2e` com os 7 testes de fumaça passando
- [ ] Nenhum segredo no bundle público (aba Network/Sources)

## 5. Monitoramento

- **GitHub Actions `uptime`**: verifica `/api/health` a cada 30 minutos e falha (notificando os admins do repositório) se o status não for `ok` ou o banco não responder.
- Opcional: UptimeRobot ou similar apontando para `/api/health` a cada 5 minutos.
- Health responde **503** quando o banco falha.
- Acompanhar logs da Vercel e do Supabase; revisar `audit_log` em caso de incidente.
- Free tier: sem SLA; acompanhar limites de Auth/DB.

## 6. Rollback

- **Aplicação:** Vercel → Deployments → deployment anterior → **Promote to Production**.
- **Banco:** migrações são forward-only; se necessário, restaurar backup diário do Supabase.
- **Credenciais comprometidas:** rotacionar `APP_SECRET` (invalida convites), senha do admin e service role; revogar PAT; revisar acessos.

## 7. Riscos aceitos

- Ambiente único (D-14): previews usam o mesmo banco de produção.
- Sem MFA (D-28); admin com senha forte e acesso restrito.
- Limites do plano Free do Supabase/Vercel.
