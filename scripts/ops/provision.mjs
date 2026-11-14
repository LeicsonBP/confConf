#!/usr/bin/env node
/**
 * Provisionamento assistido do Supabase (M0).
 *
 * O que faz, de forma idempotente:
 *   1. garante os projetos confconf-dev e confconf-prod (região sa-east-1);
 *   2. aplica a configuração de Auth dos dois;
 *   3. aplica as migrações versionadas em cada projeto;
 *   4. cria o administrador master (GoTrue + allowlist) e imprime a senha uma vez;
 *   5. verifica tabelas, RLS e funções;
 *   6. grava .ops/dev.env, .ops/prod.env e .env.local (todos ignorados pelo git).
 *
 * Entrada:
 *   .ops/secrets.env  (ou variável de ambiente)
 *     SUPABASE_ACCESS_TOKEN=sbp_...
 *     SUPABASE_ORG_ID=...            (opcional; usa a primeira organização)
 *     ADMIN_EMAIL=admin@confconf.invalid (opcional)
 *     ADMIN_PASSWORD=...             (opcional; senão é gerado e salvo)
 *
 * Uso:
 *   node scripts/ops/provision.mjs
 *   node scripts/ops/provision.mjs --only=dev
 */

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const OPS_DIR = resolve(ROOT, ".ops");
const API = "https://api.supabase.com/v1";
const REGION = "sa-east-1";
const PROJECTS = [
  { role: "dev", name: "confconf-dev" },
  { role: "prod", name: "confconf-prod" },
];

const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyRole = onlyArg ? onlyArg.split("=")[1] : null;

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

function generateSecret(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

function generateDbPassword() {
  return randomBytes(24).toString("base64url").replace(/[^A-Za-z0-9]/g, "x");
}

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

async function resolveOrganizationId() {
  if (process.env.SUPABASE_ORG_ID) return process.env.SUPABASE_ORG_ID;
  try {
    const organizations = await api("/organizations");
    if (!organizations?.length) throw new Error("Nenhuma organização encontrada no token.");
    if (organizations.length > 1) {
      log(`Organizações: ${organizations.map((o) => `${o.name} (${o.id})`).join(", ")}`);
      log("Mais de uma organização; usando a primeira. Defina SUPABASE_ORG_ID para escolher.");
    }
    return organizations[0].id;
  } catch (error) {
    log(`Listagem de organizações indisponível (${error.message}).`);
    const projects = await api("/projects");
    const organizationId = projects?.find((project) => project.organization_id)?.organization_id;
    if (!organizationId) {
      throw new Error(
        "Não foi possível descobrir a organização. Defina SUPABASE_ORG_ID em .ops/secrets.env.",
      );
    }
    log(`Organização derivada do projeto existente: ${organizationId}.`);
    return organizationId;
  }
}

async function ensureProject(organizationId, project) {
  const existing = (await api("/projects"))?.find(
    (item) => item.name === project.name || item.id === project.name,
  );
  if (existing) {
    log(`${project.name} já existe (${existing.id}, ${existing.status}).`);
    return existing;
  }

  const dbPassword = readOrCreate(resolve(OPS_DIR, `dbpass.${project.role}`), generateDbPassword);
  log(`Criando ${project.name} em ${REGION}...`);
  await api("/projects", {
    method: "POST",
    body: JSON.stringify({
      name: project.name,
      organization_id: organizationId,
      region: REGION,
      db_pass: dbPassword,
    }),
  });

  for (let attempt = 1; attempt <= 60; attempt += 1) {
    await sleep(10_000);
    const projects = await api("/projects");
    const found = projects?.find((item) => item.name === project.name);
    if (found && found.status?.startsWith("ACTIVE")) {
      log(`${project.name} ativo (${found.id}).`);
      return found;
    }
    if (attempt % 6 === 0) log(`${project.name}: estado ${found?.status ?? "desconhecido"}...`);
  }
  throw new Error(`Tempo esgotado aguardando ${project.name}.`);
}

async function getKeys(ref) {
  const keys = await api(`/projects/${ref}/api-keys`);
  const anon = keys?.find((key) => key.name === "anon")?.api_key;
  const service = keys?.find((key) => key.name === "service_role")?.api_key;
  if (!anon || !service) {
    throw new Error(`Chaves não encontradas em ${ref}: ${keys?.map((k) => k.name).join(", ")}`);
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
  const skipped = Object.keys(desired).filter((key) => !(key in patch));
  if (Object.keys(patch).length) {
    await api(`/projects/${ref}/config/auth`, { method: "PATCH", body: JSON.stringify(patch) });
  }
  log(`Auth de ${ref}: ${Object.keys(patch).length} campos aplicados.`);
  if (skipped.length) log(`Auth de ${ref}: ignorados (não suportados) -> ${skipped.join(", ")}`);
}

function pushMigrations(ref, dbPassword) {
  const env = {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN,
    SUPABASE_DB_PASSWORD: dbPassword,
  };
  const run = (args) =>
    execFileSync("npx", args, { cwd: ROOT, env, stdio: "inherit", shell: process.platform === "win32" });
  log(`Aplicando migrações em ${ref}...`);
  run(["supabase", "link", "--project-ref", ref]);
  run(["supabase", "db", "push"]);
}

async function supabaseFetch(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${url} -> ${response.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

async function ensureAdmin(ref, serviceKey, role) {
  const base = `https://${ref}.supabase.co`;
  const email = process.env.ADMIN_EMAIL ?? "admin@confconf.invalid";
  const passwordPath = resolve(OPS_DIR, `admin-password.${role}`);
  const password = process.env.ADMIN_PASSWORD ?? readOrCreate(passwordPath, () => generateSecret(18));
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  const list = await supabaseFetch(`${base}/auth/v1/admin/users?per_page=200`, { headers });
  const existing = (list?.users ?? []).find((user) => user.email === email);
  let userId = existing?.id;

  if (!userId) {
    const created = await supabaseFetch(`${base}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    userId = created.id;
    log(`Admin criado em ${role} (${email}).`);
  } else {
    log(`Admin já existe em ${role} (${email}).`);
  }

  await supabaseFetch(`${base}/rest/v1/rpc/bootstrap_admin`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_user_id: userId, p_note: `admin master (${role})` }),
  });

  writeFileSync(
    resolve(OPS_DIR, `admin-credentials.${role}.txt`),
    `email=${email}\npassword=${password}\nproject=${ref}\n`,
    "utf8",
  );

  return { email, password, userId };
}

async function verify(ref) {
  const rows = await api(`/projects/${ref}/database/query`, {
    method: "POST",
    body: JSON.stringify({
      query: `
        select
          (select count(*)::int from pg_tables where schemaname = 'public') as tabelas,
          (select count(*)::int from pg_class c
             join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity) as sem_rls,
          (select count(*)::int from pg_proc p
             join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'private') as funcoes_private,
          (select count(*)::int from public.admin_users) as admins
      `,
    }),
  });
  const result = Array.isArray(rows) ? rows[0] : rows;
  log(`Verificação de ${ref}: ${JSON.stringify(result)}`);
  if (result?.sem_rls !== 0) throw new Error(`${ref}: ${result?.sem_rls} tabela(s) sem RLS.`);
  if ((result?.admins ?? 0) < 1) throw new Error(`${ref}: nenhum administrador na allowlist.`);
  return result;
}

function writeEnvFiles(dev, prod, appSecret) {
  const common = (data) => [
    `NEXT_PUBLIC_SUPABASE_URL=https://${data.ref}.supabase.co`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${data.anon}`,
    `SUPABASE_SERVICE_ROLE_KEY=${data.service}`,
    `APP_SECRET=${appSecret}`,
  ];

  writeFileSync(
    resolve(OPS_DIR, "dev.env"),
    [...common(dev), "NEXT_PUBLIC_APP_URL=http://localhost:3000", ""].join("\n"),
    "utf8",
  );
  writeFileSync(
    resolve(OPS_DIR, "prod.env"),
    [...common(prod), "NEXT_PUBLIC_APP_URL=https://confconf.vercel.app", ""].join("\n"),
    "utf8",
  );
  writeFileSync(
    resolve(ROOT, ".env.local"),
    [...common(dev), "NEXT_PUBLIC_APP_URL=http://localhost:3000", ""].join("\n"),
    "utf8",
  );
}

async function main() {
  loadEnvFile(resolve(OPS_DIR, "secrets.env"));
  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    throw new Error("SUPABASE_ACCESS_TOKEN ausente em .ops/secrets.env.");
  }
  mkdirSync(OPS_DIR, { recursive: true });

  const organizationId = await resolveOrganizationId();
  const appSecret = readOrCreate(resolve(OPS_DIR, "app-secret"), () => generateSecret(32));
  const results = {};

  for (const project of PROJECTS) {
    if (onlyRole && project.role !== onlyRole) continue;
    const created = await ensureProject(organizationId, project);
    const ref = created.id;
    const keys = await getKeys(ref);
    await configureAuth(ref);
    const dbPassword = readOrCreate(resolve(OPS_DIR, `dbpass.${project.role}`), generateDbPassword);
    pushMigrations(ref, dbPassword);
    await ensureAdmin(ref, keys.service, project.role);
    await verify(ref);
    results[project.role] = { ref, ...keys };
    log(`--- ${project.name} pronto: https://${ref}.supabase.co`);
  }

  if (results.dev && results.prod) {
    writeEnvFiles(results.dev, results.prod, appSecret);
    log("Arquivos gravados: .ops/dev.env, .ops/prod.env, .env.local");
    log("Valores para a Vercel (Production):");
    for (const line of readFileSync(resolve(OPS_DIR, "prod.env"), "utf8").trim().split("\n")) {
      if (line.includes("SERVICE_ROLE") || line.includes("APP_SECRET")) {
        log(`  ${line.split("=")[0]}=<valor em .ops/prod.env>`);
      } else {
        log(`  ${line}`);
      }
    }
  }
  log("Concluído.");
}

main().catch((error) => {
  console.error(`[provision] ERRO: ${error.message}`);
  process.exitCode = 1;
});
