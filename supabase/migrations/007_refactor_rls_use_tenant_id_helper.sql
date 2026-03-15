-- Refactor RLS policies to use public.tenant_id() instead of inline JWT extraction.
-- public.tenant_id() is STABLE PARALLEL SAFE (see 005_auth_tenant_id_helper.sql).

-- tenants
DROP POLICY IF EXISTS "Tenants can read their own row" ON public.tenants;
CREATE POLICY "Tenants can read their own row"
  ON public.tenants
  FOR SELECT
  USING (id = public.tenant_id());

-- tenant_users
DROP POLICY IF EXISTS "Tenants select own tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenants insert own tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenants update own tenant_users" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenants delete own tenant_users" ON public.tenant_users;

CREATE POLICY "Tenants select own tenant_users"
  ON public.tenant_users FOR SELECT
  USING (tenant_id = public.tenant_id());

CREATE POLICY "Tenants insert own tenant_users"
  ON public.tenant_users FOR INSERT
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Tenants update own tenant_users"
  ON public.tenant_users FOR UPDATE
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Tenants delete own tenant_users"
  ON public.tenant_users FOR DELETE
  USING (tenant_id = public.tenant_id());

-- posts
DROP POLICY IF EXISTS "Tenants select own posts" ON public.posts;
DROP POLICY IF EXISTS "Tenants insert own posts" ON public.posts;
DROP POLICY IF EXISTS "Tenants update own posts" ON public.posts;
DROP POLICY IF EXISTS "Tenants delete own posts" ON public.posts;

CREATE POLICY "Tenants select own posts"
  ON public.posts FOR SELECT
  USING (tenant_id = public.tenant_id());

CREATE POLICY "Tenants insert own posts"
  ON public.posts FOR INSERT
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Tenants update own posts"
  ON public.posts FOR UPDATE
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Tenants delete own posts"
  ON public.posts FOR DELETE
  USING (tenant_id = public.tenant_id());
