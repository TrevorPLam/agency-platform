-- RLS index verification (T-13). Run after: npx supabase start
-- Replace YOUR_TENANT_UUID with: SELECT id FROM public.tenants WHERE slug = 'riverside-hotel';

-- Simulate authenticated session with tenant context (Supabase sets request.jwt.claims from JWT).
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","app_metadata":{"tenant_id":"YOUR_TENANT_UUID"}}', true);
SET ROLE authenticated;

-- Should use Index Scan on idx_tenant_users_tenant_id (not Seq Scan).
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM public.tenant_users;

-- Should use Index Scan on idx_posts_tenant_id (or idx_posts_tenant_created) (not Seq Scan).
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM public.posts;

-- Reset for other use.
RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);
