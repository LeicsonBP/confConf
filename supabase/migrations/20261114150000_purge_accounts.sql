-- D-23: remover participante exclui a conta; excluir evento exclui as contas
-- dos participantes. Também limpa usuários órfãos (sem participação).

create or replace function public.admin_remove_participant(
  p_event uuid,
  p_participant uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_user_is_admin boolean;
begin
  if not private.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  if exists (select 1 from public.draw_runs dr where dr.event_id = p_event) then
    raise exception 'Não é possível remover participantes depois do sorteio'
      using errcode = '23514';
  end if;

  select ep.user_id
    into v_user
    from public.event_participants ep
   where ep.id = p_participant
     and ep.event_id = p_event;

  if v_user is null then
    raise exception 'Participante não encontrado' using errcode = 'P0002';
  end if;

  delete from public.event_participants where id = p_participant;

  select exists (select 1 from public.admin_users au where au.user_id = v_user)
    into v_user_is_admin;

  if not v_user_is_admin then
    delete from auth.users where id = v_user;
  end if;

  insert into public.audit_log (actor_user_id, actor_kind, action, entity, entity_id, metadata)
  values (
    (select auth.uid()),
    'admin',
    'participante.removido',
    'event_participant',
    p_participant,
    jsonb_build_object('evento', p_event)
  );
end;
$$;

revoke all on function public.admin_remove_participant(uuid, uuid) from public, anon;
grant execute on function public.admin_remove_participant(uuid, uuid) to authenticated;

create or replace function public.admin_delete_event(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_users uuid[];
  v_count integer;
begin
  if not private.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  perform 1 from public.events e where e.id = p_event for update;
  if not found then
    raise exception 'Confraternização não encontrada' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(distinct ep.user_id), '{}'::uuid[])
    into v_users
    from public.event_participants ep
   where ep.event_id = p_event;

  v_count := coalesce(array_length(v_users, 1), 0);

  delete from public.events where id = p_event;

  if v_count > 0 then
    delete from auth.users u
     where u.id = any (v_users)
       and not exists (select 1 from public.admin_users au where au.user_id = u.id);
  end if;

  insert into public.audit_log (actor_user_id, actor_kind, action, entity, entity_id, metadata)
  values (
    (select auth.uid()),
    'admin',
    'evento.excluido',
    'event',
    p_event,
    jsonb_build_object('participantes', v_count)
  );
end;
$$;

revoke all on function public.admin_delete_event(uuid) from public, anon;
grant execute on function public.admin_delete_event(uuid) to authenticated;
