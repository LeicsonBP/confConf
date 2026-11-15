-- D-31: remove a opção "outra restrição" e limpa os cadastros existentes.
update public.event_participants
set dietary_restrictions = array_remove(dietary_restrictions, 'outra'),
    dietary_other = null
where 'outra' = any(dietary_restrictions)
   or dietary_other is not null;

alter table public.event_participants
  add constraint event_participants_no_other_restriction
  check (not ('outra' = any(dietary_restrictions)));

comment on column public.event_participants.dietary_other is
  'Campo legado; não é mais utilizado após a remoção de "outra restrição"';
