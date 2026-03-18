-- Contact form submissions: firm (tenant_id null) and client sites (tenant_id set).
-- RLS: tenants can only read/update/delete their own rows; INSERT is service-role only so server actions use getAdminClient().
CREATE TABLE public.contact_submissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  source     text NOT NULL,
  name       text NOT NULL,
  email      text NOT NULL,
  message    text NOT NULL,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contact_submissions_tenant_id ON public.contact_submissions (tenant_id);
CREATE INDEX idx_contact_submissions_tenant_created ON public.contact_submissions (tenant_id, created_at DESC);
CREATE INDEX idx_contact_submissions_source ON public.contact_submissions (source);
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions (created_at DESC);

CREATE POLICY "Tenants select own contact submissions"
  ON public.contact_submissions FOR SELECT
  USING (tenant_id IS NOT NULL AND tenant_id = public.tenant_id());

-- No INSERT policy: only service role can insert (server actions use getAdminClient()).

CREATE POLICY "Tenants update own contact submissions"
  ON public.contact_submissions FOR UPDATE
  USING (tenant_id IS NOT NULL AND tenant_id = public.tenant_id())
  WITH CHECK (tenant_id IS NOT NULL AND tenant_id = public.tenant_id());

CREATE POLICY "Tenants delete own contact submissions"
  ON public.contact_submissions FOR DELETE
  USING (tenant_id IS NOT NULL AND tenant_id = public.tenant_id());
