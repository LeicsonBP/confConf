-- D-24: seleção de itens do planejamento alimentar (checkboxes + calcular)
alter table public.events
  add column if not exists food_selection text[] not null
  default array[
    'salgadinhos',
    'salgados',
    'doces',
    'bolo',
    'refrigerante',
    'agua',
    'gelo',
    'descartaveis'
  ]::text[];

alter table public.events
  add constraint events_food_selection_subset check (
    food_selection <@ array[
      'salgadinhos',
      'salgados',
      'doces',
      'bolo',
      'refrigerante',
      'agua',
      'gelo',
      'descartaveis'
    ]::text[]
  );

comment on column public.events.food_selection is
  'Itens escolhidos para o planejamento alimentar; o cálculo considera apenas estes itens';
