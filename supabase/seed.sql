-- Seed data for local development
-- Run with: pnpm supabase:reset (applies migrations + seed)
-- All seed user passwords: Password1!

-- ============================================================
-- Auth trigger: create profile row when a new user signs up.
-- In production this must be created manually via Dashboard → SQL Editor
-- (Supabase Cloud blocks auth schema triggers via db push).
-- Locally, seed.sql runs after migrations, so we create it here.
-- See: supabase/auth_trigger.sql
-- ============================================================
CREATE OR REPLACE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."handle_new_user"();

-- ============================================================
-- Helper: lookup user id by email (used by e2e test cleanup)
-- Only exists in local dev — seed.sql is NOT applied in production.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(lookup_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT id FROM auth.users WHERE email = lookup_email LIMIT 1;
$$;

-- ============================================================
-- User 1: Alice — Solo Developer, full profile with social links
-- ============================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, is_sso_user)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'alice@example.com',
  extensions.crypt('Password1!', extensions.gen_salt('bf')),
  now(),
  '{"full_name": "Alice Johnson"}'::jsonb,
  now(), now(), '', false
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'alice@example.com',
  'email',
  '{"sub": "a1b2c3d4-0001-4000-8000-000000000001", "email": "alice@example.com"}'::jsonb,
  now(), now(), now()
)
ON CONFLICT DO NOTHING;

UPDATE public.profiles SET
  role = 'solo-developer',
  bio = 'Full-stack developer passionate about developer tools and open source.',
  social_links = '[{"label":"github","url":"https://github.com/alice"},{"label":"twitter","url":"https://x.com/alicejohnson"}]'::jsonb
WHERE id = 'a1b2c3d4-0001-4000-8000-000000000001';

-- ============================================================
-- User 2: Bob — Product Manager, partial profile
-- ============================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, is_sso_user)
VALUES (
  'a1b2c3d4-0002-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'bob@example.com',
  extensions.crypt('Password1!', extensions.gen_salt('bf')),
  now(),
  '{"full_name": "Bob Martinez"}'::jsonb,
  now(), now(), '', false
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a1b2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'bob@example.com',
  'email',
  '{"sub": "a1b2c3d4-0002-4000-8000-000000000002", "email": "bob@example.com"}'::jsonb,
  now(), now(), now()
)
ON CONFLICT DO NOTHING;

UPDATE public.profiles SET
  role = 'product-manager',
  bio = 'Building products that solve real problems. Previously at a YC startup.',
  social_links = '[{"label":"linkedin","url":"https://linkedin.com/in/bobmartinez"}]'::jsonb
WHERE id = 'a1b2c3d4-0002-4000-8000-000000000002';

-- ============================================================
-- User 3: Carol — Designer, minimal profile
-- ============================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, is_sso_user)
VALUES (
  'a1b2c3d4-0003-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'carol@example.com',
  extensions.crypt('Password1!', extensions.gen_salt('bf')),
  now(),
  '{"full_name": "Carol Chen"}'::jsonb,
  now(), now(), '', false
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a1b2c3d4-0003-4000-8000-000000000003',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'carol@example.com',
  'email',
  '{"sub": "a1b2c3d4-0003-4000-8000-000000000003", "email": "carol@example.com"}'::jsonb,
  now(), now(), now()
)
ON CONFLICT DO NOTHING;

UPDATE public.profiles SET
  role = 'designer',
  bio = 'UX designer who codes. Focused on accessible, minimalist interfaces.'
WHERE id = 'a1b2c3d4-0003-4000-8000-000000000003';

-- ============================================================
-- User 4: Dave — Student, empty profile (new user scenario)
-- ============================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, is_sso_user)
VALUES (
  'a1b2c3d4-0004-4000-8000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'dave@example.com',
  extensions.crypt('Password1!', extensions.gen_salt('bf')),
  now(),
  '{"full_name": ""}'::jsonb,
  now(), now(), '', false
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a1b2c3d4-0004-4000-8000-000000000004',
  'a1b2c3d4-0004-4000-8000-000000000004',
  'dave@example.com',
  'email',
  '{"sub": "a1b2c3d4-0004-4000-8000-000000000004", "email": "dave@example.com"}'::jsonb,
  now(), now(), now()
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- pg_cron jobs: schedule background maintenance tasks.
-- In production these must be created manually via Dashboard → SQL Editor
-- (similar to the auth trigger — cron.schedule runs as postgres role).
-- See: supabase/cron_jobs.sql
-- ============================================================

-- Mark in-progress responses older than 24h as abandoned (every hour)
SELECT cron.schedule(
  'cleanup_abandoned_responses',
  '0 * * * *',
  $$SELECT public.cleanup_abandoned_responses()$$
);

-- Auto-complete surveys past their ends_at date (every 15 min)
SELECT cron.schedule(
  'complete_expired_surveys',
  '*/15 * * * *',
  $$SELECT public.complete_expired_surveys()$$
);
