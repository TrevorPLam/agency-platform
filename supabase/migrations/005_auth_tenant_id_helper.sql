-- Helper used by RLS policies to read tenant_id from JWT app_metadata.
-- Created in public schema (migrations cannot create in auth schema).
-- STABLE PARALLEL SAFE so PostgreSQL evaluates it once per query (initplan).
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'tenant_id')::uuid
$$;

GRANT EXECUTE ON FUNCTION public.tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.tenant_id() TO anon;
