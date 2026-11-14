-- Smoke test do esquema inicial (M0).
-- Roda no CI via `supabase test db` contra o Supabase local.

begin;

select plan(8);

select has_table('public', 'profiles', 'profiles existe');
select has_table('public', 'events', 'events existe');
select has_table('public', 'event_participants', 'event_participants existe');
select has_table('public', 'secret_santa_assignments', 'secret_santa_assignments existe');
select has_table('public', 'wishlist_items', 'wishlist_items existe');
select has_table('public', 'audit_log', 'audit_log existe');

select has_function('private', 'is_admin', array[]::text[], 'helper private.is_admin existe');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.events'::regclass),
  'RLS habilitada em events'
);

select * from finish();

rollback;
