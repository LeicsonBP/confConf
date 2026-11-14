-- D-22: data prevista do sorteio (opcional, eventos com amigo secreto)
alter table public.events add column if not exists draw_scheduled_at timestamptz;

comment on column public.events.draw_scheduled_at is
  'Data prevista do sorteio do amigo secreto (opcional); exibida ao participante';
