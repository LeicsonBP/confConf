# Deploy na Vercel

Guia para importar o repositório e publicar os dois ambientes. O deploy é feito pela integração GitHub ↔ Vercel; o CI do repositório cuida dos testes e o Supabase cuida do banco.

## 1. Pré-requisitos

- Projeto importado no GitHub: `LeicsonBP/confConf`
- Projetos Supabase `confconf-dev` e `confconf-prod` criados (pelo agente no M0)
- Chaves anon e service role dos dois projetos em mãos

## 2. Importar o projeto

1. Vercel → **Add New → Project**.
2. Selecione o repositório `confConf`.
3. Preset: **Next.js** (detectado automaticamente).
4. Build Command: `npm run build` · Output: padrão (`.next`) · Install: `npm install`.
5. **Root Directory:** repositório inteiro.
6. Node.js Version: a **LTS** disponível no seletor (o CI usa 22).
7. Clique em **Deploy** apenas depois de configurar as variáveis (passo 3).

## 3. Variáveis de ambiente

Configure em **Settings → Environment Variables**, com escopo por ambiente:

| Variável | Production | Preview | Development |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | projeto prod | projeto dev | projeto dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | projeto prod | projeto dev | projeto dev |
| `SUPABASE_SERVICE_ROLE_KEY` | projeto prod | projeto dev | projeto dev |
| `APP_SECRET` | segredo de produção | segredo de teste | segredo de teste |
| `NEXT_PUBLIC_APP_URL` | URL de produção | `https://<preview>` (opcional) | `http://localhost:3000` |

Onde obter:

- **URL e chave anon:** Supabase → Project Settings → API → Project URL / anon public key.
- **service role:** Supabase → Project Settings → API → service_role secret. **Somente servidor.**
- **APP_SECRET:** gere com `openssl rand -base64 48` (ou `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`).

> Atenção: `SUPABASE_SERVICE_ROLE_KEY` e `APP_SECRET` **nunca** podem ter o prefixo `NEXT_PUBLIC_`. O CI alerta se aparecer.

## 4. Branches e ambientes

Em **Settings → Git**:

- **Production Branch:** `main`
- Preview: habilitado para `develop` e para pull requests.

Resultado:

| Branch | Deploy | Banco |
|---|---|---|
| `main` | Production | `confconf-prod` |
| `develop` | Preview (estável) | `confconf-dev` |
| `feature/*` | Preview (efêmero) | `confconf-dev` |

## 5. URL do ambiente de teste

1. Faça o primeiro merge em `develop`.
2. Em **Deployments**, copie a URL do preview da branch.
3. Opcional: em **Settings → Domains**, atribua um alias (ex.: `teste-confconf.vercel.app`) apontando para a branch `develop`.

## 6. Checklist pós-importação

- [ ] Build de `main` concluído sem erro
- [ ] `GET /api/health` responde `{ "status": "ok" }`
- [ ] Login do admin funciona com o projeto de produção
- [ ] Cadastro por convite e sorteio funcionam no ambiente de teste
- [ ] Recuperação de acesso funciona (precisa de `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] `/admin` e `/app` não são indexados (`robots.txt` + `noindex`)
- [ ] Nenhum segredo aparece no bundle público

## 7. Problemas comuns

| Sintoma | Causa provável | Correção |
|---|---|---|
| Build falha com "supabaseUrl is required" | variáveis ausentes no ambiente | cadastrar as variáveis e refazer o deploy |
| Login em loop | banco de Preview apontando para produção | revisar escopo das variáveis |
| 401 ao cadastrar | confirmação de e-mail ligada no projeto | desligar confirmação no Supabase |
| Recuperação falha | `SUPABASE_SERVICE_ROLE_KEY` ausente | cadastrar a chave no ambiente correto |

## 8. Migrações de produção

O deploy da Vercel não altera o banco. No release:

```bash
npx supabase link --project-ref <ref-prod>
npx supabase db push
```

Aplicar **antes** do deploy do código que depende da migração.
