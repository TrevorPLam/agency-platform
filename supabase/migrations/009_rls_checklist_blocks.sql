-- T-13.03: RLS checklist applied as table comments (append-only; do not edit 001–008).
-- Checklist: ENABLE RLS | tenant_id FK | INDEX tenant_id | INDEX (tenant_id, created_at)
--           SELECT/INSERT/UPDATE/DELETE using public.tenant_id() | pgTAP covers table
-- This project uses public.tenant_id() (migrations cannot create in auth schema).

COMMENT ON TABLE public.tenants IS 'RLS CHECKLIST: ENABLE RLS; SELECT (id = public.tenant_id()); service role writes.';
COMMENT ON TABLE public.tenant_users IS 'RLS CHECKLIST: ENABLE RLS; tenant_id FK; INDEX tenant_id; SELECT, INSERT, UPDATE, DELETE using public.tenant_id(); pgTAP covers.';
COMMENT ON TABLE public.posts IS 'RLS CHECKLIST: ENABLE RLS; tenant_id FK; INDEX tenant_id, (tenant_id, created_at); SELECT, INSERT, UPDATE, DELETE using public.tenant_id(); pgTAP covers.';
COMMENT ON TABLE public.audit_log IS 'RLS CHECKLIST: ENABLE RLS; tenant_id FK; INDEX (tenant_id, created_at); USING (false) service-role only.';
COMMENT ON TABLE public.customer_auth_mappings IS 'RLS CHECKLIST: ENABLE RLS; tenant_id FK; SELECT (user_id = auth.uid()); service role insert/update/delete.';
