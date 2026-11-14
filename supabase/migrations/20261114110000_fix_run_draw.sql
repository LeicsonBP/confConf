-- Corrige ambiguidade entre a variável `i` do plpgsql e a coluna do alias
-- no INSERT do sorteio (42702).

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
    v_receivers := v_ids;
    for i in reverse v_count..2 loop
      j := 1 + (private.random_int32() % (i - 1));
      tmp := v_receivers[i];
      v_receivers[i] := v_receivers[j];
      v_receivers[j] := tmp;
    end loop;
  end if;

  insert into public.secret_santa_assignments (event_id, giver_participant_id, receiver_participant_id)
  select p_event, v_ids[g.idx], v_receivers[g.idx]
    from generate_series(1, v_count) as g(idx);

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
