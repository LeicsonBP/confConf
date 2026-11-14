# Deploy na Vercel

Guia para importar o repositório e publicar a aplicação. O deploy é feito pela integração GitHub ↔ Vercel; o CI do repositório cuida dos testes e o Supabase cuida do banco.

> **Ambiente único (D-14):** não há banco de teste separado. A `main` é a única branch de trabalho e de deploy; toda validação de banco roda no Supabase local dentro do CI.

## 1. Pré-requisitos

- Repositório `LeicsonBP/confConf`
- Projeto Supabase `confConf` (`spfciwfphtvkadyrhkiu`) configurado
- Valores das chaves em `.ops/confconf.env`

## 2. Importar o projeto

1. Vercel → **Add New → Project**.
2. Selecione o repositório `confConf`.
3. Preset: **Next.js** (detectado automaticamente).
4. Build Command: `npm run build` · Output: padrão (`.next`) · Install: `npm install`.
5. **Root Directory:** repositório inteiro.
6. Node.js Version: a **LTS** disponível no seletor (o CI usa 22).
7. Configure as variáveis (passo 3) antes do primeiro deploy.

## 3. Variáveis de ambiente

Em **Settings → Environment Variables**, com o mesmo valor para **Production** e **Preview** (existe um único banco):

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://spfciwfphtvkadyrhkiu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave anon do projeto (`NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.ops/confconf.env`) |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service role (`SUPABASE_SERVICE_ROLE_KEY` em `.ops/confconf.env`) |
| `APP_SECRET` | `APP_SECRET` em `.ops/confconf.env` |
| `NEXT_PUBLIC_APP_URL` | URL pública de produção |

> `SUPABASE_SERVICE_ROLE_KEY` e `APP_SECRET` **nunca** com prefixo `NEXT_PUBLIC_`.
> O arquivo `.ops/confconf.env` é local e ignorado pelo git — não cole esses valores em arquivos versionados.

## 4. Branches e ambientes

Em **Settings → Git**:

- **Production Branch:** `main`
- Preview: opcional; lembrando que previews usam o **mesmo banco** — evite testes destrutivos.

| Branch | Deploy | Banco |
|---|---|---|
| `main` | Production | `confConf` |
| outras | Preview (opcional) | `confConf` (mesmo) |

## 5. Checklist pós-importação

- [ ] Build de `main` concluído sem erro
- [ ] `GET /api/health` responde `{ "status": "ok" }`
- [ ] Login do admin funciona com as credenciais de `.ops/admin-credentials.confconf.txt`
- [ ] Cadastro por convite, sorteio e recuperação funcionam (recuperação exige `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] `/admin` e `/app` não são indexados (`robots.txt` + `noindex`)
- [ ] Nenhum segredo aparece no bundle público

## 6. Problemas comuns

| Sintoma | Causa provável | Correção |
|---|---|---|
| Build falha com "supabaseUrl is required" | variáveis ausentes | cadastrar e refazer o deploy |
| Login em loop | URL/chave trocadas | conferir as duas variáveis públicas |
| 401 ao cadastrar | confirmação de e-mail ligada no projeto | desligar confirmação no Supabase |
| Recuperação falha | `SUPABASE_SERVICE_ROLE_KEY` ausente | cadastrar a chave no ambiente correto |

## 7. Migrações antes do deploy

O deploy da Vercel não altera o banco. Aplique as migrações **antes** de publicar código que dependa delas:

```bash
npm run ops:provision      # aplica pela Management API (funciona sem a senha do banco)
# ou, com a senha do banco configurada:
npx supabase db push --remote
```
