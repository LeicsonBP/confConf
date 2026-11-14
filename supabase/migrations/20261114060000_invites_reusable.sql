-- =============================================================================
-- Convites reutilizáveis (D-15): link sempre visível ao admin e com usos
-- configuráveis (ilimitado por padrão). O token é guardado cifrado (AES-GCM)
-- e o hash continua sendo a chave de busca/validação.
-- =============================================================================

alter table public.invites
  alter column token_hash type text using encode(token_hash, 'hex');

alter table public.invites alter column max_uses drop not null;
alter table public.invites alter column max_uses drop default;

alter table public.invites drop constraint if exists invites_max_uses_check;
alter table public.invites
  add constraint invites_max_uses_check
  check (max_uses is null or (max_uses between 1 and 5000));

alter table public.invites drop constraint if exists invites_check;
alter table public.invites
  add constraint invites_used_count_check
  check (used_count >= 0 and (max_uses is null or used_count <= max_uses));

alter table public.invites add column token_ciphertext text;

comment on column public.invites.token_hash is 'SHA-256 hexadecimal do token do convite';
comment on column public.invites.token_ciphertext is 'Token cifrado com APP_SECRET (AES-256-GCM) para o admin poder reexibir o link';
comment on column public.invites.max_uses is 'NULL = usos ilimitados (link compartilhável em grupo)';

-- -----------------------------------------------------------------------------
-- Prévia pública do convite (anon): valida token, expiração e usos
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

-- -----------------------------------------------------------------------------
-- Consumo do convite: cria perfil + participação de forma atômica
-- -----------------------------------------------------------------------------
create or replace function public.redeem_invite(
  p_token_hash text,
  p_full_name text,
  p_birth_date date,
  p_username text,
  p_restrictions text[],
  p_other text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.invites;
  v_user uuid := (select auth.uid());
  v_participant uuid;
  v_restrictions public.dietary_restriction[];
begin
  if v_user is null then
    raise exception 'Sessão necessária' using errcode = '42501';
  end if;

  select * into v_invite
    from public.invites i
   where i.token_hash = p_token_hash
   for update;

  if not found then
    raise exception 'Convite inválido' using errcode = '22023';
  end if;
  if v_invite.revoked_at is not null then
    raise exception 'Convite revogado' using errcode = '22023';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'Convite expirado' using errcode = '22023';
  end if;
  if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
    raise exception 'Convite esgotado' using errcode = '22023';
  end if;

  -- Chamada repetida do mesmo usuário é idempotente.
  select ep.id into v_participant
    from public.event_participants ep
   where ep.event_id = v_invite.event_id
     and ep.user_id = v_user
   limit 1;

  if v_participant is not null then
    return v_participant;
  end if;

  begin
    v_restrictions := coalesce(p_restrictions, '{}')::public.dietary_restriction[];
  exception
    when others then
      raise exception 'Restrições inválidas' using errcode = '22023';
  end;

  insert into public.profiles (id, username, full_name, birth_date)
  values (v_user, p_username, btrim(p_full_name), p_birth_date)
  on conflict (id) do update set full_name = excluded.full_name;

  insert into public.event_participants (event_id, user_id, dietary_restrictions, dietary_other)
  values (
    v_invite.event_id,
    v_user,
    v_restrictions,
    nullif(btrim(coalesce(p_other, '')), '')
  )
  returning id into v_participant;

  update public.invites
     set used_count = used_count + 1,
         last_used_at = now()
   where id = v_invite.id;

  insert into public.audit_log (actor_user_id, actor_kind, action, entity, entity_id, metadata)
  values (
    v_user,
    'participante',
    'convite.usado',
    'invite',
    v_invite.id,
    jsonb_build_object('evento', v_invite.event_id)
  );

  return v_participant;
end;
$$;

revoke all on function public.redeem_invite(text, text, date, text, text[], text)
  from public, anon;
grant execute on function public.redeem_invite(text, text, date, text, text[], text)
  to authenticated;
