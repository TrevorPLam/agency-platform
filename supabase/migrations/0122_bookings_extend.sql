-- Extend bookings for request-style submissions (name, email, requested_at, optional message/service).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS service_slug text,
  ADD COLUMN IF NOT EXISTS message text;

-- Allow optional name/email for backward compatibility during migration; then enforce via app.
ALTER TABLE public.bookings ALTER COLUMN email DROP DEFAULT;
