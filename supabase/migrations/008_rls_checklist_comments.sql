-- RLS checklist comments (T-13). Documentation only; no schema change.
-- See docs/RLS_VERIFICATION.md for full verification steps.

COMMENT ON TABLE public.tenants IS 'RLS: SELECT only (id = public.tenant_id()). Service role writes.';
COMMENT ON TABLE public.tenant_users IS 'RLS: SELECT, INSERT, UPDATE, DELETE using public.tenant_id(). Indexes: tenant_id, user_id.';
COMMENT ON TABLE public.posts IS 'RLS: SELECT, INSERT, UPDATE, DELETE using public.tenant_id(). Indexes: tenant_id, (tenant_id, created_at DESC).';
COMMENT ON TABLE public.audit_log IS 'RLS: service-role only (USING false). Index: (tenant_id, created_at DESC).';
COMMENT ON TABLE public.customer_auth_mappings IS 'RLS: SELECT USING (user_id = auth.uid()). Service role insert/update/delete.';
