-- Seed local/teste: SOMENTE dados fictícios (repositório é público).
-- Participantes dependem de usuários do GoTrue e são criados pelos testes de
-- integração; aqui fica apenas um evento de exemplo.

insert into public.events (
  id,
  name,
  description,
  location,
  starts_at,
  max_gift_cents,
  extra_info,
  has_secret_santa
)
values (
  '00000000-0000-4000-8000-000000000001',
  'Confraternização de exemplo',
  'Evento fictício criado pelo seed para desenvolvimento local.',
  'Salão de festas do prédio',
  now() + interval '30 days',
  15000,
  'Levar algo para compartilhar.',
  true
)
on conflict (id) do nothing;

insert into public.events (
  id,
  name,
  description,
  location,
  starts_at,
  has_secret_santa
)
values (
  '00000000-0000-4000-8000-000000000002',
  'Almoço sem amigo secreto',
  'Evento fictício sem sorteio, para testar o modo opcional.',
  'Restaurante do bairro',
  now() + interval '45 days',
  false
)
on conflict (id) do nothing;
