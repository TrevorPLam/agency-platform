-- Seed data for local development (optional).
-- This file is run after migrations during `supabase db reset`.
-- Riley Day Care: first real client (use id in .env.local for auth).
INSERT INTO public.tenants (slug, domain, name, industry)
VALUES ('riley-day-care', 'localhost', 'Riley Day Care', 'general')
ON CONFLICT (slug) DO NOTHING;
