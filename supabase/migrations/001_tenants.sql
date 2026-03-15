-- Create the tenants table. This is the source of truth for all tenant metadata.
CREATE TABLE public.tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  domain      text NOT NULL UNIQUE,
  name        text NOT NULL,
  industry    text NOT NULL CHECK (industry IN ('healthcare', 'ecommerce', 'hospitality', 'general')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on the tenants table itself.
-- Tenants can read their own row; only service role can write.
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can read their own row"
  ON public.tenants
  FOR SELECT
  USING (id = (
    (current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'tenant_id')::uuid
  ));
