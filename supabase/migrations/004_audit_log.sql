-- Audit log: records every data modification with tenant context.
-- Essential for debugging and compliance (GUIDE §9).
CREATE TABLE public.audit_log (
  id          bigserial PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id),
  table_name  text NOT NULL,
  record_id   uuid NOT NULL,
  action      text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  user_id     uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_log_tenant_created ON public.audit_log (tenant_id, created_at DESC);

-- Service role only — audit logs are never writable by end users.
CREATE POLICY "Service role only"
  ON public.audit_log
  USING (false);
