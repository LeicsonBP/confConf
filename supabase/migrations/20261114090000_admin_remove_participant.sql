-- =============================================================================
-- Remoção de participante pelo administrador (M3)
-- Física e permitida apenas antes do sorteio; o elenco congelado continua
-- valendo depois do sorteio. Auditoria registrada.
-- =============================================================================

create or replace function public.admin_remove_participant(
  p_event uuid,
  p_participant uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  if exists (select 1 from public.draw_runs dr where dr.event_id = p_event) then
    raise exception 'Não é possível remover participantes depois do sorteio'
      using errcode = '23514';
  end if;

  delete from public.event_participants ep
   where ep.id = p_participant
     and ep.event_id = p_event;

  if not found then
    raise exception 'Participante não encontrado' using errcode = 'P0002';
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
