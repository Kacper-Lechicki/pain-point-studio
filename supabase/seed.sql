-- Seed data for local development
-- Run with: pnpm supabase:reset (applies migrations + seed)
-- All seed user passwords: Password1!

-- pgcrypto lives in the extensions schema — make crypt()/gen_salt() visible
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- Helper: lookup user id by email (used by e2e test cleanup)
-- Only exists in local dev — seed.sql is NOT applied in production.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(lookup_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
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
  crypt('Password1!', gen_salt('bf')),
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
  crypt('Password1!', gen_salt('bf')),
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
  crypt('Password1!', gen_salt('bf')),
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
  crypt('Password1!', gen_salt('bf')),
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
