-- =============================================================================
-- confConf — esquema inicial (M0)
-- Schemas: public (exposto com RLS) e private (helpers, não exposto).
-- Toda tabela nasce com RLS habilitada e sem regra permissiva.
-- Escritas privilegiadas (sorteio, convites, cadastro) acontecem em funções
-- security definer criadas nos marcos seguintes.
-- =============================================================================

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.dietary_restriction as enum (
  'vegetariano',
  'vegano',
  'sem_lactose',
  'sem_gluten',
  'outra'
);

create type public.report_category as enum ('recebi_eu_mesmo', 'nao_recebi', 'outro');
create type public.report_status as enum ('aberto', 'em_analise', 'resolvido', 'descartado');

-- -----------------------------------------------------------------------------
-- Funções de trigger e helpers (privado)
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.hash_key(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(coalesce(p_value, ''), 'UTF8')), 'hex');
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_event_participant(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event_participants ep
    where ep.event_id = p_event
      and ep.user_id = (select auth.uid())
      and ep.removed_at is null
  );
$$;

create or replace function private.has_draw(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.draw_runs dr
    where dr.event_id = p_event
  );
$$;

create or replace function private.drew(p_participant uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.secret_santa_assignments ssa
    join public.event_participants giver
      on giver.id = ssa.giver_participant_id
    where ssa.receiver_participant_id = p_participant
      and giver.user_id = (select auth.uid())
  );
$$;

grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_event_participant(uuid) to authenticated;
grant execute on function private.has_draw(uuid) to authenticated;
grant execute on function private.drew(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Perfis e administradores
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9-]{2,40}-[0-9]{3}$'),
  full_name text not null check (char_length(full_name) between 2 and 120),
  birth_date date not null
    check (birth_date >= date '1900-01-01' and birth_date <= date '2100-01-01'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  note text check (note is null or char_length(note) <= 200)
);

-- -----------------------------------------------------------------------------
-- Eventos, elenco e convites
-- -----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 120),
  description text check (description is null or char_length(description) <= 2000),
  location text check (location is null or char_length(location) <= 200),
  starts_at timestamptz not null,
  timezone text not null default 'America/Sao_Paulo',
  max_gift_cents integer
    check (max_gift_cents is null or max_gift_cents between 0 and 100000000),
  extra_info text check (extra_info is null or char_length(extra_info) <= 2000),
  has_secret_santa boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_starts_at_idx on public.events (starts_at);

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  dietary_restrictions public.dietary_restriction[] not null default '{}',
  dietary_other text check (dietary_other is null or char_length(dietary_other) <= 300),
  confirmed_draw_at timestamptz,
  removed_at timestamptz,
  joined_at timestamptz not null default now(),
  constraint event_participants_unique unique (event_id, user_id)
);

create index event_participants_event_idx on public.event_participants (event_id);
create index event_participants_user_idx on public.event_participants (user_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  token_hash bytea not null unique,
  label text check (label is null or char_length(label) <= 80),
  expires_at timestamptz not null default (now() + interval '30 days'),
  max_uses integer not null default 1 check (max_uses between 1 and 500),
  used_count integer not null default 0 check (used_count >= 0 and used_count <= max_uses),
  revoked_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index invites_event_idx on public.invites (event_id);

-- -----------------------------------------------------------------------------
-- Sorteio
-- -----------------------------------------------------------------------------
create table public.secret_santa_assignments (
  event_id uuid not null references public.events (id) on delete cascade,
  giver_participant_id uuid not null
    references public.event_participants (id) on delete cascade,
  receiver_participant_id uuid not null
    references public.event_participants (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, giver_participant_id),
  constraint secret_santa_assignments_unique_receiver
    unique (event_id, receiver_participant_id),
  constraint secret_santa_assignments_no_self
    check (giver_participant_id <> receiver_participant_id)
);

create table public.draw_runs (
  event_id uuid primary key references public.events (id) on delete cascade,
  executed_by uuid references auth.users (id) on delete set null,
  executed_at timestamptz not null default now(),
  participant_count integer not null check (participant_count >= 2),
  algorithm text not null default 'fisher-yates-derangement-v1',
  rng_source text not null default 'pgcrypto.gen_random_bytes'
);

-- -----------------------------------------------------------------------------
-- Lista de desejos e relatos
-- -----------------------------------------------------------------------------
create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null
    references public.event_participants (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 500),
  url text check (
    url is null
    or (char_length(url) <= 500 and url ~* '^https?://')
  ),
  priority smallint not null default 2 check (priority between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wishlist_participant_idx on public.wishlist_items (participant_id);

create table public.problem_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  participant_id uuid not null
    references public.event_participants (id) on delete cascade,
  category public.report_category not null,
  message text not null check (char_length(message) between 10 and 2000),
  status public.report_status not null default 'aberto',
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index reports_event_status_idx on public.problem_reports (event_id, status);

-- -----------------------------------------------------------------------------
-- Auditoria append-only e throttle
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_user_id uuid,
  actor_kind text not null check (actor_kind in ('admin', 'participante', 'anonimo', 'sistema')),
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text
);

create index audit_log_at_idx on public.audit_log (at desc);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

create table private.auth_throttle (
  bucket text primary key,
  kind text not null,
  window_start timestamptz not null default now(),
  attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Triggers de integridade
-- -----------------------------------------------------------------------------
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger trg_events_updated_at
  before update on public.events
  for each row execute function private.set_updated_at();

create trigger trg_wishlist_updated_at
  before update on public.wishlist_items
  for each row execute function private.set_updated_at();

create or replace function private.profiles_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.username <> old.username then
    raise exception 'profiles.username é imutável' using errcode = '23514';
  end if;
  if new.birth_date <> old.birth_date then
    raise exception 'profiles.birth_date é imutável' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trg_profiles_immutable
  before update on public.profiles
  for each row execute function private.profiles_immutable();

create or replace function private.event_participants_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event uuid;
begin
  if tg_op = 'INSERT' or tg_op = 'DELETE' then
    v_event := coalesce(new.event_id, old.event_id);
    if exists (select 1 from public.draw_runs dr where dr.event_id = v_event) then
      raise exception 'O elenco não pode ser alterado após o sorteio' using errcode = '23514';
    end if;
    return coalesce(new, old);
  end if;

  if new.event_id <> old.event_id or new.user_id <> old.user_id then
    raise exception 'O vínculo entre participante e evento é imutável' using errcode = '23514';
  end if;

  if exists (select 1 from public.draw_runs dr where dr.event_id = new.event_id) then
    if new.confirmed_draw_at is distinct from old.confirmed_draw_at
      and new.dietary_restrictions = old.dietary_restrictions
      and new.dietary_other is not distinct from old.dietary_other
      and new.removed_at is not distinct from old.removed_at
      and new.joined_at = old.joined_at
    then
      return new;
    end if;
    raise exception 'O elenco está congelado após o sorteio' using errcode = '23514';
  end if;

  if not private.is_admin() and new.removed_at is distinct from old.removed_at then
    raise exception 'Somente o administrador pode remover um participante' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger trg_event_participants_guard
  before insert or update or delete on public.event_participants
  for each row execute function private.event_participants_guard();

create or replace function private.event_freeze()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.has_secret_santa
    and not new.has_secret_santa
    and exists (select 1 from public.draw_runs dr where dr.event_id = new.id)
  then
    raise exception 'Não é possível desligar o amigo secreto após o sorteio'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trg_event_freeze
  before update on public.events
  for each row execute function private.event_freeze();

create or replace function private.audit_log_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log é append-only' using errcode = '42501';
end;
$$;

create trigger trg_audit_log_guard
  before update or delete on public.audit_log
  for each row execute function private.audit_log_guard();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.invites enable row level security;
alter table public.secret_santa_assignments enable row level security;
alter table public.draw_runs enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.problem_reports enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (private.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- admin_users: sem políticas. Acesso somente via private.is_admin().

-- events
create policy events_admin_all on public.events
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy events_select_participant on public.events
  for select to authenticated
  using (private.is_event_participant(id));

-- event_participants
create policy event_participants_admin_all on public.event_participants
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy event_participants_select_own on public.event_participants
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy event_participants_update_own on public.event_participants
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- invites
create policy invites_admin_all on public.invites
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- secret_santa_assignments
create policy secret_santa_select_own on public.secret_santa_assignments
  for select to authenticated
  using (
    exists (
      select 1
      from public.event_participants giver
      where giver.id = giver_participant_id
        and giver.user_id = (select auth.uid())
    )
  );

create policy secret_santa_select_admin on public.secret_santa_assignments
  for select to authenticated
  using (private.is_admin());

-- draw_runs
create policy draw_runs_select_admin on public.draw_runs
  for select to authenticated
  using (private.is_admin());

create policy draw_runs_select_participant on public.draw_runs
  for select to authenticated
  using (private.is_event_participant(event_id));

-- wishlist_items
create policy wishlist_owner_all on public.wishlist_items
  for all to authenticated
  using (
    exists (
      select 1
      from public.event_participants ep
      where ep.id = participant_id
        and ep.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.event_participants ep
      where ep.id = participant_id
        and ep.user_id = (select auth.uid())
    )
  );

create policy wishlist_giftee_select on public.wishlist_items
  for select to authenticated
  using (private.drew(participant_id));

-- problem_reports
create policy problem_reports_insert_own on public.problem_reports
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.event_participants ep
      where ep.id = participant_id
        and ep.user_id = (select auth.uid())
    )
  );

create policy problem_reports_select_own on public.problem_reports
  for select to authenticated
  using (
    exists (
      select 1
      from public.event_participants ep
      where ep.id = participant_id
        and ep.user_id = (select auth.uid())
    )
  );

create policy problem_reports_admin_select on public.problem_reports
  for select to authenticated
  using (private.is_admin());

create policy problem_reports_admin_update on public.problem_reports
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- audit_log: leitura apenas do admin; escrita só por funções do sistema.
create policy audit_log_select_admin on public.audit_log
  for select to authenticated
  using (private.is_admin());

-- -----------------------------------------------------------------------------
-- Privilégios de tabela (a RLS é a segunda camada, não a única)
-- -----------------------------------------------------------------------------
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

revoke all on public.admin_users from anon, authenticated;

revoke all on public.events from anon, authenticated;
grant select, insert, update, delete on public.events to authenticated;

revoke all on public.event_participants from anon, authenticated;
grant select on public.event_participants to authenticated;
grant update (dietary_restrictions, dietary_other) on public.event_participants
  to authenticated;

revoke all on public.invites from anon, authenticated;
grant select, insert, update, delete on public.invites to authenticated;

revoke all on public.secret_santa_assignments from anon, authenticated;
grant select on public.secret_santa_assignments to authenticated;

revoke all on public.draw_runs from anon, authenticated;
grant select on public.draw_runs to authenticated;

revoke all on public.wishlist_items from anon, authenticated;
grant select, insert, update, delete on public.wishlist_items to authenticated;

revoke all on public.problem_reports from anon, authenticated;
grant select, insert on public.problem_reports to authenticated;
grant update (status, admin_note, resolved_at) on public.problem_reports
  to authenticated;

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

-- Administrador precisa atualizar `removed_at` em event_participants; o trigger
-- distingue admin de participante, mas o grant de coluna acima não. Concedemos
-- a coluna para o admin via função dedicada em M3 (admin_remove_participant).
