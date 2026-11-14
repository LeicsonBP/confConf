-- =============================================================================
-- Endereço do evento + identificador de usuário simplificado (D-16/D-17)
-- =============================================================================

alter table public.events add column if not exists address text;
alter table public.events drop constraint if exists events_address_check;
alter table public.events
  add constraint events_address_check
  check (address is null or char_length(address) <= 300);

comment on column public.events.address is 'Endereço completo do evento (opcional), exibido aos convidados';

-- Novo formato: primeiro nome + 3 dígitos, sem símbolos (ex.: leicson745).
-- Mantemos hífens permitidos para não invalidar identificadores já emitidos.
alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles
  add constraint profiles_username_check
  check (username ~ '^[a-z0-9-]{4,44}$');

-- -----------------------------------------------------------------------------
-- Prévia do convite passa a devolver o endereço (importante para o convidado)
-- -----------------------------------------------------------------------------
create or replace function public.invite_preview(p_token_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_invite public.invites;
  v_event public.events;
begin
  if p_token_hash is null or length(p_token_hash) < 32 then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;

  select * into v_invite from public.invites i where i.token_hash = p_token_hash;
  if not found then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;
  if v_invite.revoked_at is not null then
    return jsonb_build_object('valid', false, 'reason', 'revoked');
  end if;
  if v_invite.expires_at <= now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;
  if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
    return jsonb_build_object('valid', false, 'reason', 'exhausted');
  end if;

  select * into v_event from public.events e where e.id = v_invite.event_id;
  if not found then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;

  return jsonb_build_object(
    'valid', true,
    'invite_id', v_invite.id,
    'expires_at', v_invite.expires_at,
    'event', jsonb_build_object(
      'id', v_event.id,
      'name', v_event.name,
      'description', v_event.description,
      'location', v_event.location,
      'address', v_event.address,
      'starts_at', v_event.starts_at,
      'timezone', v_event.timezone,
      'max_gift_cents', v_event.max_gift_cents,
      'has_secret_santa', v_event.has_secret_santa
    )
  );
end;
$$;

revoke all on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to anon, authenticated;
