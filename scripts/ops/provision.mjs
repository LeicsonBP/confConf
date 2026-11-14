#!/usr/bin/env node
/**
 * Provisionamento assistido do Supabase (ambiente único, D-14).
 *
 * Idempotente:
 *   1. garante o projeto `confConf` (ou informado em SUPABASE_PROJECT_NAME);
 *   2. aplica a configuração de Auth;
 *   3. aplica as migrações pendentes — pelo CLI, se houver senha do banco,
 *      ou pela Management API (sem senha);
 *   4. cria o administrador master (GoTrue + allowlist) se ainda não existir;
 *   5. verifica tabelas, RLS e funções;
 *   6. grava .ops/confconf.env e .env.local (ignorados pelo git).
 *
 * Entrada: .ops/secrets.env (ou variáveis de ambiente)
 *   SUPABASE_ACCESS_TOKEN=sbp_...
 *   SUPABASE_PROJECT_NAME=confConf        (opcional)
 *   SUPABASE_ORG_ID=...                   (opcional; necessário só para criar projeto)
 *   SUPABASE_DB_PASSWORD=...              (opcional; sem ela, migrações via API)
 *   ADMIN_EMAIL=admin@confconf.invalid    (opcional)
 *   ADMIN_PASSWORD=...                    (opcional)
 *
 * Uso: node scripts/ops/provision.mjs
 */

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const OPS_DIR = resolve(ROOT, ".ops");
const MIGRATIONS_DIR = resolve(ROOT, "supabase/migrations");
const API = "https://api.supabase.com/v1";
const REGION = process.env.SUPABASE_REGION ?? "sa-east-1";
const PROJECT_NAME = process.env.SUPABASE_PROJECT_NAME ?? "confConf";

function log(message) {
  console.log(`[provision] ${message}`);
}

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

function readOrCreate(path, factory) {
  if (existsSync(path)) return readFileSync(path, "utf8").trim();
  const value = factory();
  writeFileSync(path, `${value}\n`, "utf8");
  return value;
}

const generateSecret = (bytes = 24) => randomBytes(bytes).toString("base64url");
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function api(path, init = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} -> ${response.status}: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function sql(ref, query) {
  const body = JSON.stringify({ query });
  const response = await fetch(`${API}/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: Buffer.from(body, "utf8"),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`SQL -> ${response.status}: ${text.slice(0, 600)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function resolveOrganizationId() {
  if (process.env.SUPABASE_ORG_ID) return process.env.SUPABASE_ORG_ID;
  try {
    const organizations = await api("/organizations");
    if (organizations?.length) return organizations[0].id;
  } catch (error) {
    log(`Listagem de organizações indisponível (${error.message}).`);
  }
  const projects = await api("/projects");
  const organizationId = projects?.find((project) => project.organization_id)?.organization_id;
  if (!organizationId) {
    throw new Error("Defina SUPABASE_ORG_ID em .ops/secrets.env.");
  }
  return organizationId;
}

async function ensureProject() {
  const existing = (await api("/projects"))?.find((item) => item.name === PROJECT_NAME);
  if (existing) {
    log(`Projeto ${PROJECT_NAME} encontrado (${existing.id}, ${existing.region}).`);
    return existing;
  }

  log(`Projeto ${PROJECT_NAME} não existe; tentando criar em ${REGION}...`);
  const organizationId = await resolveOrganizationId();
  const dbPassword = readOrCreate(resolve(OPS_DIR, "dbpass.confconf"), () =>
    randomBytes(24).toString("base64url").replace(/[^A-Za-z0-9]/g, "x"),
  );
  try {
    await api("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: PROJECT_NAME,
        organization_id: organizationId,
        region: REGION,
        db_pass: dbPassword,
      }),
    });
  } catch (error) {
    throw new Error(
      `Não foi possível criar o projeto (${error.message}). ` +
        "O token precisa de Projects: write na organização, ou crie o projeto pelo painel.",
    );
  }

  for (let attempt = 1; attempt <= 60; attempt += 1) {
    await sleep(10_000);
    const found = (await api("/projects"))?.find((item) => item.name === PROJECT_NAME);
    if (found?.status?.startsWith("ACTIVE")) {
      log(`Projeto ativo (${found.id}).`);
      return found;
    }
    if (attempt % 6 === 0) log(`Aguardando: ${found?.status ?? "desconhecido"}...`);
  }
  throw new Error("Tempo esgotado aguardando o projeto ficar ativo.");
}

async function getKeys(ref) {
  const keys = await api(`/projects/${ref}/api-keys`);
  const anon = keys?.find((key) => key.name === "anon")?.api_key;
  const service = keys?.find((key) => key.name === "service_role")?.api_key;
  if (!anon || !service) {
    throw new Error(`Chaves não encontradas: ${keys?.map((k) => k.name).join(", ")}`);
  }
  return { anon, service };
}

async function configureAuth(ref) {
  const current = await api(`/projects/${ref}/config/auth`);
  const desired = {
    mailer_autoconfirm: true,
    password_min_length: 6,
    password_required_characters: "",
    external_email_enabled: true,
    disable_signup: false,
    security_captcha_enabled: false,
    password_hibp_enabled: false,
    refresh_token_rotation_enabled: true,
    jwt_exp: 3600,
  };
  const patch = Object.fromEntries(
    Object.entries(desired).filter(([key]) => Object.prototype.hasOwnProperty.call(current, key)),
  );
  if (Object.keys(patch).length) {
    await api(`/projects/${ref}/config/auth`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  }
  log(`Auth configurado (${Object.keys(patch).length} campos).`);
}

async function applyMigrationsViaApi(ref) {
  await sql(
    ref,
    `create schema if not exists supabase_migrations;
     create table if not exists supabase_migrations.schema_migrations (
       version text primary key,
       statements text[],
       name text
     );`,
  );

  const rows = await sql(ref, "select version from supabase_migrations.schema_migrations");
  const applied = new Set((rows ?? []).map((row) => row.version));
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = file.slice(0, 14);
    if (applied.has(version)) {
      log(`Migração ${version} já aplicada.`);
      continue;
    }
    log(`Aplicando ${file} via Management API...`);
    const content = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    await sql(ref, `begin;\n${content}\ncommit;`);
    await sql(
      ref,
      `insert into supabase_migrations.schema_migrations (version, name)
       values ('${version}', '${file.replace(/\.sql$/, "")}')
       on conflict (version) do nothing;`,
    );
  }
}

function pushMigrationsViaCli(ref, dbPassword) {
  const env = {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN,
    SUPABASE_DB_PASSWORD: dbPassword,
  };
  const run = (args) =>
    execFileSync("npx", args, {
      cwd: ROOT,
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
  log("Aplicando migrações pelo CLI...");
  run(["supabase", "link", "--project-ref", ref]);
  run(["supabase", "db", "push", "--remote"]);
}

async function supabaseFetch(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${url} -> ${response.status}: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function ensureAdmin(ref, serviceKey) {
  const base = `https://${ref}.supabase.co`;
  const email = process.env.ADMIN_EMAIL ?? "admin@confconf.invalid";
  const passwordFile = resolve(OPS_DIR, "admin-password.confconf");
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  const list = await supabaseFetch(`${base}/auth/v1/admin/users?per_page=200`, { headers });
  const existing = (list?.users ?? []).find((user) => user.email === email);
  let userId = existing?.id;

  if (!userId) {
    const password = process.env.ADMIN_PASSWORD ?? readOrCreate(passwordFile, () => generateSecret(18));
    const created = await supabaseFetch(`${base}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    userId = created.id;
    writeFileSync(
      resolve(OPS_DIR, "admin-credentials.confconf.txt"),
      `username=admin\nemail=${email}\npassword=${password}\nproject=${ref}\n`,
      "utf8",
    );
    log(`Admin criado: ${email}`);
  } else if (existsSync(passwordFile)) {
    const password = readFileSync(passwordFile, "utf8").trim();
    writeFileSync(
      resolve(OPS_DIR, "admin-credentials.confconf.txt"),
      `username=admin\nemail=${email}\npassword=${password}\nproject=${ref}\n`,
      "utf8",
    );
    log(`Admin já existe: ${email}`);
  } else {
    log(
      `Admin já existe: ${email} (senha desconhecida — não há arquivo local para reconstruir a credencial).`,
    );
  }

  await supabaseFetch(`${base}/rest/v1/rpc/bootstrap_admin`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_user_id: userId, p_note: "admin master" }),
  });

  return { email, userId };
}

async function verify(ref) {
  const rows = await sql(
    ref,
    `select
       (select count(*)::int from pg_tables where schemaname = 'public') as tabelas,
       (select count(*)::int from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity) as sem_rls,
       (select count(*)::int from public.admin_users) as admins`,
  );
  const result = Array.isArray(rows) ? rows[0] : rows;
  log(`Verificação: ${JSON.stringify(result)}`);
  if (result?.sem_rls !== 0) throw new Error(`${result?.sem_rls} tabela(s) sem RLS.`);
  if ((result?.admins ?? 0) < 1) throw new Error("Nenhum administrador na allowlist.");
}

function writeEnvFiles(ref, keys, appSecret) {
  const lines = [
    `NEXT_PUBLIC_SUPABASE_URL=https://${ref}.supabase.co`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${keys.anon}`,
    `SUPABASE_SERVICE_ROLE_KEY=${keys.service}`,
    `APP_SECRET=${appSecret}`,
    "NEXT_PUBLIC_APP_URL=http://localhost:3000",
  ];
  writeFileSync(resolve(OPS_DIR, "confconf.env"), `${lines.join("\n")}\n`, "utf8");
  writeFileSync(resolve(ROOT, ".env.local"), `${lines.join("\n")}\n`, "utf8");
  log("Gravados: .ops/confconf.env e .env.local");
}

async function main() {
  loadEnvFile(resolve(OPS_DIR, "secrets.env"));
  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    throw new Error("SUPABASE_ACCESS_TOKEN ausente em .ops/secrets.env.");
  }
  mkdirSync(OPS_DIR, { recursive: true });

  const project = await ensureProject();
  const ref = project.id;
  const keys = await getKeys(ref);
  await configureAuth(ref);

  if (process.env.SUPABASE_DB_PASSWORD) {
    pushMigrationsViaCli(ref, process.env.SUPABASE_DB_PASSWORD);
  } else {
    log("Sem SUPABASE_DB_PASSWORD: usando Management API para as migrações.");
    await applyMigrationsViaApi(ref);
  }

  await ensureAdmin(ref, keys.service);
  await verify(ref);

  const appSecret = readOrCreate(resolve(OPS_DIR, "app-secret"), () => generateSecret(32));
  writeEnvFiles(ref, keys, appSecret);
  log(`Concluído: https://${ref}.supabase.co`);
}

main().catch((error) => {
  console.error(`[provision] ERRO: ${error.message}`);
  process.exitCode = 1;
});
