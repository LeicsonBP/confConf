-- D-25: unifica "salgadinhos" em "salgados" e ajusta a seleção padrão.
alter table public.events drop constraint if exists events_food_selection_subset;

-- Converte a chave antiga e remove duplicatas.
update public.events
set food_selection = array_replace(food_selection, 'salgadinhos', 'salgados');

update public.events
set food_selection = coalesce(
  (select array_agg(distinct k) from unnest(food_selection) as k),
  '{}'::text[]
);

alter table public.events
  alter column food_selection set default array[
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
      'salgados',
      'doces',
      'bolo',
      'refrigerante',
      'agua',
      'gelo',
      'descartaveis'
    ]::text[]
  );
