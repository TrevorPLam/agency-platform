-- Tenant-scoped bookings table. RLS uses public.tenant_id() (see 005_auth_tenant_id_helper.sql).
CREATE TABLE public.bookings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_bookings_tenant_id ON public.bookings (tenant_id);
CREATE INDEX idx_bookings_tenant_created ON public.bookings (tenant_id, created_at DESC);

CREATE POLICY "Tenants select own bookings"
  ON public.bookings FOR SELECT
  USING (tenant_id = public.tenant_id());

CREATE POLICY "Tenants insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Tenants update own bookings"
  ON public.bookings FOR UPDATE
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Tenants delete own bookings"
  ON public.bookings FOR DELETE
  USING (tenant_id = public.tenant_id());
