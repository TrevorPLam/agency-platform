-- Maps real_email to auth_email per tenant for the email aliasing login flow.
-- Service role writes (signup); users can read only their own row(s).
CREATE TABLE public.customer_auth_mappings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  real_email  text NOT NULL,
  auth_email  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, real_email)
);

ALTER TABLE public.customer_auth_mappings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_customer_auth_mappings_tenant_id ON public.customer_auth_mappings (tenant_id);
CREATE INDEX idx_customer_auth_mappings_user_id ON public.customer_auth_mappings (user_id);
CREATE INDEX idx_customer_auth_mappings_tenant_real ON public.customer_auth_mappings (tenant_id, real_email);

-- Users can read only their own mapping row(s).
CREATE POLICY "Users read own customer_auth_mappings"
  ON public.customer_auth_mappings
  FOR SELECT
  USING (user_id = auth.uid());

-- Only service role can insert/update/delete (no policies for anon/authenticated).
