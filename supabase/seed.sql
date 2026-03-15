-- Seed data for local development (optional).
-- This file is run after migrations during `supabase db reset`.
-- T-12.11: Test tenant for riverside-hotel (use id in .env.local for T-15).
INSERT INTO public.tenants (slug, domain, name, industry)
VALUES ('riverside-hotel', 'localhost', 'Riverside Hotel', 'hospitality')
ON CONFLICT (slug) DO NOTHING;
