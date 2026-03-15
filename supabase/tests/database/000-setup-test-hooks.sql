-- T-14: pgTAP setup. Runs first (alphabetical order). Enables extension and verifies test harness.
-- See: https://supabase.com/docs/guides/local-development/testing/overview

begin;
create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

select plan(1);
select ok(true, 'pgTAP extension loaded and test harness ready');

select * from finish();
rollback;
