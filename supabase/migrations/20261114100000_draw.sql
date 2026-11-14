-- =============================================================================
-- M4 — Sorteio do amigo secreto
-- Derangement uniforme (Fisher–Yates com rejeição de ponto fixo) e fallback
-- Sattolo. Execução única por evento, protegida e auditada.
-- =============================================================================

create or replace function private.random_int32()
returns integer
language sql
volatile
set search_path = ''
as $$
  select (
    (get_byte(b, 0) << 24) |
    (get_byte(b, 1) << 16) |
    (get_byte(b, 2) << 8) |
    get_byte(b, 3)
  ) & 2147483647
  from extensions.gen_random_bytes(4) as b;
$$;

create or replace function public.run_draw(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_receivers uuid[];
  v_count integer;
  i integer;
  j integer;
  tmp uuid;
  ok boolean := false;
  attempts integer := 0;
begin
  if not private.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  perform 1 from public.events e where e.id = p_event for update;
  if not found then
    raise exception 'Confraternização não encontrada' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.draw_runs dr where dr.event_id = p_event) then
    raise exception 'O sorteio já foi realizado' using errcode = '23505';
  end if;

  if not (select e.has_secret_santa from public.events e where e.id = p_event) then
    raise exception 'Esta confraternização não tem amigo secreto' using errcode = '23514';
  end if;

  select array_agg(ep.id order by ep.joined_at, ep.id)
    into v_ids
    from public.event_participants ep
   where ep.event_id = p_event
     and ep.removed_at is null;

  v_count := coalesce(array_length(v_ids, 1), 0);
  if v_count < 2 then
    raise exception 'São necessários ao menos 2 participantes' using errcode = '23514';
  end if;

  while attempts < 100 loop
    attempts := attempts + 1;
    v_receivers := v_ids;

    for i in reverse v_count..2 loop
      j := 1 + (private.random_int32() % i);
      tmp := v_receivers[i];
      v_receivers[i] := v_receivers[j];
      v_receivers[j] := tmp;
    end loop;

    ok := true;
    for i in 1..v_count loop
      if v_receivers[i] = v_ids[i] then
        ok := false;
        exit;
      end if;
    end loop;

    exit when ok;
  end loop;

  if not ok then
    -- Fallback Sattolo: sempre um ciclo único, portanto sem ponto fixo.
    v_receivers := v_ids;
    for i in reverse v_count..2 loop
      j := 1 + (private.random_int32() % (i - 1));
      tmp := v_receivers[i];
      v_receivers[i] := v_receivers[j];
      v_receivers[j] := tmp;
    end loop;
  end if;

  insert into public.secret_santa_assignments (event_id, giver_participant_id, receiver_participant_id)
  select p_event, v_ids[i], v_receivers[i]
    from generate_series(1, v_count) as g(i);

  insert into public.draw_runs (event_id, executed_by, participant_count)
  values (p_event, (select auth.uid()), v_count);

  insert into public.audit_log (actor_user_id, actor_kind, action, entity, entity_id, metadata)
  values (
    (select auth.uid()),
    'admin',
    'sorteio.executado',
    'event',
    p_event,
    jsonb_build_object('participantes', v_count)
  );
end;
$$;

revoke all on function public.run_draw(uuid) from public, anon;
grant execute on function public.run_draw(uuid) to authenticated;

create or replace function public.get_my_assignment(p_event uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_participant uuid;
  v_receiver uuid;
  v_name text;
  v_confirmed timestamptz;
begin
  select ep.id, ep.confirmed_draw_at
    into v_participant, v_confirmed
    from public.event_participants ep
   where ep.event_id = p_event
     and ep.user_id = (select auth.uid())
     and ep.removed_at is null
   limit 1;

  if v_participant is null then
    return null;
  end if;

  select ssa.receiver_participant_id
    into v_receiver
    from public.secret_santa_assignments ssa
   where ssa.event_id = p_event
     and ssa.giver_participant_id = v_participant;

  if v_receiver is null then
    return null;
  end if;

  select p.full_name
    into v_name
    from public.event_participants ep2
    join public.profiles p on p.id = ep2.user_id
   where ep2.id = v_receiver;

  return jsonb_build_object(
    'receiver_name', v_name,
    'receiver_participant_id', v_receiver,
    'confirmed_at', v_confirmed
  );
end;
$$;

revoke all on function public.get_my_assignment(uuid) from public, anon;
grant execute on function public.get_my_assignment(uuid) to authenticated;

create or replace function public.confirm_draw(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant uuid;
begin
  select ep.id
    into v_participant
    from public.event_participants ep
   where ep.event_id = p_event
     and ep.user_id = (select auth.uid())
     and ep.removed_at is null
   limit 1;

  if v_participant is null then
    raise exception 'Participante não encontrado' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
      from public.secret_santa_assignments ssa
     where ssa.event_id = p_event
       and ssa.giver_participant_id = v_participant
  ) then
    raise exception 'O sorteio ainda não foi realizado' using errcode = '23514';
  end if;

  update public.event_participants
     set confirmed_draw_at = coalesce(confirmed_draw_at, now())
   where id = v_participant;

  insert into public.audit_log (actor_user_id, actor_kind, action, entity, entity_id, metadata)
  values (
    (select auth.uid()),
    'participante',
    'sorteio.confirmado',
    'event',
    p_event,
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.confirm_draw(uuid) from public, anon;
grant execute on function public.confirm_draw(uuid) to authenticated;

create or replace function public.admin_list_assignments(p_event uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('giver_name', gp.full_name, 'receiver_name', rp.full_name)
      order by gp.full_name
    ),
    '[]'::jsonb
  )
  into v_result
  from public.secret_santa_assignments ssa
  join public.event_participants gpe on gpe.id = ssa.giver_participant_id
  join public.profiles gp on gp.id = gpe.user_id
  join public.event_participants rpe on rpe.id = ssa.receiver_participant_id
  join public.profiles rp on rp.id = rpe.user_id
  where ssa.event_id = p_event;

  return v_result;
end;
$$;

revoke all on function public.admin_list_assignments(uuid) from public, anon;
grant execute on function public.admin_list_assignments(uuid) to authenticated;
