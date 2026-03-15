-- Example tenant-scoped table for marketing content.
-- Every content table follows this exact RLS pattern (GUIDE §9, §10).
CREATE TABLE public.posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title       text NOT NULL,
  slug        text NOT NULL,
  content     text,
  published   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_posts_tenant_id ON public.posts (tenant_id);
CREATE INDEX idx_posts_tenant_created ON public.posts (tenant_id, created_at DESC);

CREATE POLICY "Tenants select own posts"
  ON public.posts FOR SELECT
  USING (
    tenant_id = (
      select (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "Tenants insert own posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    tenant_id = (
      select (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "Tenants update own posts"
  ON public.posts FOR UPDATE
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

CREATE POLICY "Tenants delete own posts"
  ON public.posts FOR DELETE
  USING (
    tenant_id = (
      select (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id')::uuid
    )
  );
