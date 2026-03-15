-- T-14.01: pgTAP setup. Runs first (alphabetical order). Enables pgTAP and verifies test harness.
-- Optional: http extension and Basejump test helpers (see Supabase pgtap-extended docs) require pg_tle and
-- network for dbdev; 00-rls-coverage uses a schema-wide RLS check without Basejump so tests run without them.

create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

begin;
select plan(1);
select ok(true, 'pgTAP extension loaded and test harness ready');
select * from finish();
rollback;
