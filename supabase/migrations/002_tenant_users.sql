-- Tenant membership: links auth.users to tenants with a role.
-- Required for createUserForTenant and getUserTenants in @agency/database.
CREATE TABLE public.tenant_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tenant_users_tenant_id ON public.tenant_users (tenant_id);
CREATE INDEX idx_tenant_users_user_id ON public.tenant_users (user_id);

CREATE POLICY "Tenants select own tenant_users"
  ON public.tenant_users FOR SELECT
  USING (
    tenant_id = (
      select (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "Tenants insert own tenant_users"
  ON public.tenant_users FOR INSERT
  WITH CHECK (
    tenant_id = (
      select (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "Tenants update own tenant_users"
  ON public.tenant_users FOR UPDATE
  USING (
    tenant_id = (
      select (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid
    )
  )
  WITH CHECK (
    tenant_id = (
      select (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "Tenants delete own tenant_users"
  ON public.tenant_users FOR DELETE
  USING (
    tenant_id = (
      select (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid
    )
  );
