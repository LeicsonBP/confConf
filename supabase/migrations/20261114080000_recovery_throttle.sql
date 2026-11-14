-- =============================================================================
-- Throttle de recuperação de acesso (M2)
-- Funções exclusivas de service_role: usadas pelo endpoint server-side que
-- fala com o GoTrue Admin API.
-- =============================================================================

create or replace function private.throttle(
  p_kind text,
  p_key text,
  p_max integer,
  p_window interval
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bucket text := p_kind || ':' || private.hash_key(coalesce(p_key, ''));
  v_row private.auth_throttle;
  v_retry integer;
begin
  if p_max < 1 then
    raise exception 'p_max inválido' using errcode = '22023';
  end if;

  select * into v_row from private.auth_throttle where bucket = v_bucket for update;

  if not found then
    insert into private.auth_throttle (bucket, kind, window_start, attempts, updated_at)
    values (v_bucket, p_kind, now(), 1, now());
    return query select true, 0;
    return;
  end if;

  if v_row.locked_until is not null and v_row.locked_until > now() then
    v_retry := greatest(1, ceil(extract(epoch from (v_row.locked_until - now())))::int);
    return query select false, v_retry;
    return;
  end if;

  if v_row.window_start + p_window <= now() then
    update private.auth_throttle
       set window_start = now(), attempts = 1, locked_until = null, updated_at = now()
     where bucket = v_bucket;
    return query select true, 0;
    return;
  end if;

  if v_row.attempts + 1 > p_max then
    update private.auth_throttle
       set attempts = attempts + 1, locked_until = now() + p_window, updated_at = now()
     where bucket = v_bucket;
    return query select false, extract(epoch from p_window)::int;
    return;
  end if;

  update private.auth_throttle
     set attempts = attempts + 1, updated_at = now()
   where bucket = v_bucket;

  return query select true, 0;
end;
$$;

create or replace function public.recovery_throttle(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language sql
security definer
set search_path = ''
as $$
  select *
    from private.throttle('recovery', p_key, p_max, make_interval(secs => p_window_seconds));
$$;

revoke all on function public.recovery_throttle(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.recovery_throttle(text, integer, integer) to service_role;

create or replace function public.recovery_throttle_reset(p_key text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from private.auth_throttle where bucket = 'recovery:' || private.hash_key(p_key);
$$;

revoke all on function public.recovery_throttle_reset(text)
  from public, anon, authenticated;
grant execute on function public.recovery_throttle_reset(text) to service_role;
