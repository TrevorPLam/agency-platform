-- Seed data for local development (optional).
-- This file is run after migrations during `supabase db reset`.
-- Agency (firm) tenant for booking requests and firm-scoped data.
INSERT INTO public.tenants (slug, domain, name, industry)
VALUES ('agency', 'https://agency.example.com', 'Agency', 'general')
ON CONFLICT (slug) DO NOTHING;
-- Riley Day Care: first real client (use id in .env.local for auth).
INSERT INTO public.tenants (slug, domain, name, industry)
VALUES ('riley-day-care', 'localhost', 'Riley Day Care', 'general')
ON CONFLICT (slug) DO NOTHING;
-- The Barber Cave: prospective (demo) client for onboarding validation (T-23).
INSERT INTO public.tenants (slug, domain, name, industry)
VALUES ('the-barber-cave', 'thebarbercave.com', 'The Barber Cave', 'general')
ON CONFLICT (slug) DO NOTHING;
