-- =============================================================================
-- Funções administrativas iniciais (M0)
-- - public.am_i_admin(): a UI descobre o papel sem ler admin_users.
-- - public.bootstrap_admin(): cria a allowlist do administrador master.
--   Executável SOMENTE por service_role (script de operação).
-- =============================================================================

create or replace function public.am_i_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin();
$$;

revoke all on function public.am_i_admin() from public, anon, authenticated;
grant execute on function public.am_i_admin() to authenticated;

create or replace function public.bootstrap_admin(p_user_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'Usuário % não existe em auth.users', p_user_id using errcode = '23503';
  end if;

  insert into public.admin_users (user_id, note)
  values (p_user_id, p_note)
  on conflict (user_id) do nothing;

  insert into public.audit_log (actor_kind, action, entity, entity_id, metadata)
  values ('sistema', 'admin.bootstrap', 'admin_users', p_user_id, '{}'::jsonb);
end;
$$;

revoke all on function public.bootstrap_admin(uuid, text) from public, anon, authenticated;
grant execute on function public.bootstrap_admin(uuid, text) to service_role;
