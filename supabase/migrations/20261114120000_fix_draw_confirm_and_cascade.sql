-- Correções do M4:
-- 1) confirm_draw idempotente (não viola o congelamento do elenco).
-- 2) exclusão do evento continua permitida após o sorteio (cascade), mantendo
--    bloqueio de remoção/adição manual de participantes.

create or replace function private.event_participants_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    -- Cascade do evento: quando o evento já foi apagado, libera a remoção.
    if exists (select 1 from public.events e where e.id = old.event_id)
      and exists (select 1 from public.draw_runs dr where dr.event_id = old.event_id)
    then
      raise exception 'O elenco está congelado após o sorteio' using errcode = '23514';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if exists (select 1 from public.draw_runs dr where dr.event_id = new.event_id) then
      raise exception 'O elenco está congelado após o sorteio' using errcode = '23514';
    end if;
    return new;
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

create or replace function public.confirm_draw(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant uuid;
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
    raise exception 'Participante não encontrado' using errcode = 'P0002';
  end if;

  if v_confirmed is not null then
    return;
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
     set confirmed_draw_at = now()
   where id = v_participant
     and confirmed_draw_at is null;

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
