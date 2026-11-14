-- =============================================================================
-- D-20: desfazer o sorteio para incluir novos participantes e sortear de novo.
-- Apaga pares, execução e confirmações; o elenco volta a ficar editável.
-- =============================================================================

create or replace function public.cancel_draw(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exists uuid;
begin
  if not private.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  perform 1 from public.events e where e.id = p_event for update;
  if not found then
    raise exception 'Confraternização não encontrada' using errcode = 'P0002';
  end if;

  select dr.event_id into v_exists
    from public.draw_runs dr
   where dr.event_id = p_event;

  if v_exists is null then
    raise exception 'Não há sorteio para desfazer' using errcode = '23514';
  end if;

  delete from public.secret_santa_assignments
   where event_id = p_event;

  delete from public.draw_runs
   where event_id = p_event;

  update public.event_participants
     set confirmed_draw_at = null
   where event_id = p_event
     and confirmed_draw_at is not null;

  insert into public.audit_log (actor_user_id, actor_kind, action, entity, entity_id, metadata)
  values (
    (select auth.uid()),
    'admin',
    'sorteio.desfeito',
    'event',
    p_event,
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.cancel_draw(uuid) from public, anon;
grant execute on function public.cancel_draw(uuid) to authenticated;
