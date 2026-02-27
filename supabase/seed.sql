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
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, is_sso_user)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'alice@example.com',
  extensions.crypt('Password1!', extensions.gen_salt('bf')),
  now(),
  '{"full_name": "Alice Johnson"}'::jsonb,
  now(), now(), '', '', '', '', false
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
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, is_sso_user)
VALUES (
  'a1b2c3d4-0002-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'bob@example.com',
  extensions.crypt('Password1!', extensions.gen_salt('bf')),
  now(),
  '{"full_name": "Bob Martinez"}'::jsonb,
  now(), now(), '', '', '', '', false
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
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, is_sso_user)
VALUES (
  'a1b2c3d4-0003-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'carol@example.com',
  extensions.crypt('Password1!', extensions.gen_salt('bf')),
  now(),
  '{"full_name": "Carol Chen"}'::jsonb,
  now(), now(), '', '', '', '', false
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
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, is_sso_user)
VALUES (
  'a1b2c3d4-0004-4000-8000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'dave@example.com',
  extensions.crypt('Password1!', extensions.gen_salt('bf')),
  now(),
  '{"full_name": ""}'::jsonb,
  now(), now(), '', '', '', '', false
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
-- Projects
-- ============================================================

-- Alice's project: Fitness Tracker App
INSERT INTO public.projects (id, user_id, name, summary, status)
VALUES (
  'b1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Fitness Tracker App',
  'Validating demand for a unified fitness tracking app combining workouts, nutrition, and progress analytics.',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Bob's project: API Testing Tool (no surveys)
INSERT INTO public.projects (id, user_id, name, summary, status)
VALUES (
  'b1b2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'API Testing Tool',
  'Exploring the market for developer-focused API testing solutions.',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Surveys for Alice (linked to Fitness Tracker App project)
-- ============================================================

-- Survey 1: Problem Discovery (completed, 8 responses)
INSERT INTO public.surveys (id, user_id, title, description, visibility, status, slug, starts_at, ends_at, completed_at, view_count, project_id)
VALUES (
  'c1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Do people struggle with fitness tracking?',
  'Understanding current pain points and habits around fitness activity tracking among developers and tech workers.',
  'public',
  'completed',
  'fitness-pain-pts',
  now() - interval '30 days',
  now() - interval '10 days',
  now() - interval '10 days',
  42,
  'b1b2c3d4-0001-4000-8000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Survey 2: Feature Preferences (active, 7 responses)
INSERT INTO public.surveys (id, user_id, title, description, visibility, status, slug, starts_at, view_count, project_id)
VALUES (
  'c1b2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Fitness Tracker App - Feature Preferences',
  'Validating which features matter most and willingness to pay for a unified fitness tracking solution.',
  'public',
  'active',
  'fitness-features',
  now() - interval '5 days',
  23,
  'b1b2c3d4-0001-4000-8000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Survey Questions
-- ============================================================

-- Survey 1 questions (4 questions: yes_no, rating, MC, open_text)
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1b2c3d4-0011-4000-8000-000000000011', 'c1b2c3d4-0001-4000-8000-000000000001',
   'Do you currently track your fitness activities?', 'yes_no', true, NULL, '{}', 0),
  ('d1b2c3d4-0012-4000-8000-000000000012', 'c1b2c3d4-0001-4000-8000-000000000001',
   'How satisfied are you with your current fitness tracking solution?', 'rating_scale', true,
   'Rate from 1 (very dissatisfied) to 5 (very satisfied)',
   '{"min": 1, "max": 5, "minLabel": "Very dissatisfied", "maxLabel": "Very satisfied"}', 1),
  ('d1b2c3d4-0013-4000-8000-000000000013', 'c1b2c3d4-0001-4000-8000-000000000001',
   'What frustrates you most about current fitness trackers?', 'multiple_choice', true,
   'Select the option that applies most',
   '{"options": ["Too complex", "Missing features", "Poor accuracy", "Bad UX"]}', 2),
  ('d1b2c3d4-0014-4000-8000-000000000014', 'c1b2c3d4-0001-4000-8000-000000000001',
   'Describe your ideal fitness tracking experience', 'open_text', false,
   'Share as much detail as you like', '{"maxLength": 1000}', 3)
ON CONFLICT (id) DO NOTHING;

-- Survey 2 questions (3 questions: yes_no, rating, MC)
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1b2c3d4-0021-4000-8000-000000000021', 'c1b2c3d4-0002-4000-8000-000000000002',
   'Would you use an app that combines workout and nutrition tracking in one place?', 'yes_no', true, NULL, '{}', 0),
  ('d1b2c3d4-0022-4000-8000-000000000022', 'c1b2c3d4-0002-4000-8000-000000000002',
   'How important are social/community features in a fitness app?', 'rating_scale', true,
   'Rate from 1 (not important) to 5 (essential)',
   '{"min": 1, "max": 5, "minLabel": "Not important", "maxLabel": "Essential"}', 1),
  ('d1b2c3d4-0023-4000-8000-000000000023', 'c1b2c3d4-0002-4000-8000-000000000002',
   'Which pricing model would you prefer?', 'multiple_choice', true, NULL,
   '{"options": ["Free with ads", "One-time purchase", "Monthly subscription", "Freemium"]}', 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Survey Responses
-- ============================================================

-- Survey 1 responses (8 completed, spread over ~20 days, mixed devices)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1b2c3d4-0101-4000-8000-000000000101', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now() - interval '28 days', now() - interval '28 days' + interval '4 minutes', 'desktop'),
  ('e1b2c3d4-0102-4000-8000-000000000102', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now() - interval '26 days', now() - interval '26 days' + interval '3 minutes', 'mobile'),
  ('e1b2c3d4-0103-4000-8000-000000000103', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now() - interval '24 days', now() - interval '24 days' + interval '5 minutes', 'desktop'),
  ('e1b2c3d4-0104-4000-8000-000000000104', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now() - interval '22 days', now() - interval '22 days' + interval '6 minutes', 'mobile'),
  ('e1b2c3d4-0105-4000-8000-000000000105', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now() - interval '20 days', now() - interval '20 days' + interval '3 minutes', 'desktop'),
  ('e1b2c3d4-0106-4000-8000-000000000106', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now() - interval '18 days', now() - interval '18 days' + interval '7 minutes', 'tablet'),
  ('e1b2c3d4-0107-4000-8000-000000000107', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now() - interval '15 days', now() - interval '15 days' + interval '4 minutes', 'desktop'),
  ('e1b2c3d4-0108-4000-8000-000000000108', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now() - interval '12 days', now() - interval '12 days' + interval '5 minutes', 'mobile')
ON CONFLICT (id) DO NOTHING;

-- Survey 2 responses (7 completed, spread over ~5 days)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1b2c3d4-0201-4000-8000-000000000201', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now() - interval '4 days', now() - interval '4 days' + interval '3 minutes', 'desktop'),
  ('e1b2c3d4-0202-4000-8000-000000000202', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now() - interval '4 days' + interval '2 hours', now() - interval '4 days' + interval '2 hours 5 minutes', 'mobile'),
  ('e1b2c3d4-0203-4000-8000-000000000203', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now() - interval '3 days', now() - interval '3 days' + interval '4 minutes', 'desktop'),
  ('e1b2c3d4-0204-4000-8000-000000000204', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now() - interval '3 days' + interval '3 hours', now() - interval '3 days' + interval '3 hours 6 minutes', 'mobile'),
  ('e1b2c3d4-0205-4000-8000-000000000205', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now() - interval '2 days', now() - interval '2 days' + interval '3 minutes', 'desktop'),
  ('e1b2c3d4-0206-4000-8000-000000000206', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now() - interval '1 day', now() - interval '1 day' + interval '5 minutes', 'tablet'),
  ('e1b2c3d4-0207-4000-8000-000000000207', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now() - interval '12 hours', now() - interval '12 hours' + interval '4 minutes', 'desktop')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Survey Answers
-- ============================================================

-- Survey 1 answers (8 responses x 4 questions = 32 answers)
-- Q1 yes_no: 6/8 yes = 75% → strength (>70%)
-- Q2 rating:  2+3+2+1+3+2+2+3 = avg 2.25 → threat (<=2.5)
-- Q3 MC:     "Too complex" 5/8 = 62.5% → dominant signal (>50%)
-- Q4 text:   varied responses (no signal threshold)
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  -- Response 1
  ('f1b2c3d4-0111-4000-8000-000000000111', 'e1b2c3d4-0101-4000-8000-000000000101', 'd1b2c3d4-0011-4000-8000-000000000011', '{"answer": "true"}'),
  ('f1b2c3d4-0112-4000-8000-000000000112', 'e1b2c3d4-0101-4000-8000-000000000101', 'd1b2c3d4-0012-4000-8000-000000000012', '{"rating": 2}'),
  ('f1b2c3d4-0113-4000-8000-000000000113', 'e1b2c3d4-0101-4000-8000-000000000101', 'd1b2c3d4-0013-4000-8000-000000000013', '{"selected": ["Too complex"]}'),
  ('f1b2c3d4-0114-4000-8000-000000000114', 'e1b2c3d4-0101-4000-8000-000000000101', 'd1b2c3d4-0014-4000-8000-000000000014', '{"text": "I want something simple that just tracks steps and calories without all the clutter."}'),
  -- Response 2
  ('f1b2c3d4-0121-4000-8000-000000000121', 'e1b2c3d4-0102-4000-8000-000000000102', 'd1b2c3d4-0011-4000-8000-000000000011', '{"answer": "true"}'),
  ('f1b2c3d4-0122-4000-8000-000000000122', 'e1b2c3d4-0102-4000-8000-000000000102', 'd1b2c3d4-0012-4000-8000-000000000012', '{"rating": 3}'),
  ('f1b2c3d4-0123-4000-8000-000000000123', 'e1b2c3d4-0102-4000-8000-000000000102', 'd1b2c3d4-0013-4000-8000-000000000013', '{"selected": ["Too complex"]}'),
  ('f1b2c3d4-0124-4000-8000-000000000124', 'e1b2c3d4-0102-4000-8000-000000000102', 'd1b2c3d4-0014-4000-8000-000000000014', '{"text": "Integration with my gym equipment and automatic workout detection."}'),
  -- Response 3
  ('f1b2c3d4-0131-4000-8000-000000000131', 'e1b2c3d4-0103-4000-8000-000000000103', 'd1b2c3d4-0011-4000-8000-000000000011', '{"answer": "true"}'),
  ('f1b2c3d4-0132-4000-8000-000000000132', 'e1b2c3d4-0103-4000-8000-000000000103', 'd1b2c3d4-0012-4000-8000-000000000012', '{"rating": 2}'),
  ('f1b2c3d4-0133-4000-8000-000000000133', 'e1b2c3d4-0103-4000-8000-000000000103', 'd1b2c3d4-0013-4000-8000-000000000013', '{"selected": ["Missing features"]}'),
  ('f1b2c3d4-0134-4000-8000-000000000134', 'e1b2c3d4-0103-4000-8000-000000000103', 'd1b2c3d4-0014-4000-8000-000000000014', '{"text": "A clean dashboard showing weekly trends, not just daily numbers."}'),
  -- Response 4
  ('f1b2c3d4-0141-4000-8000-000000000141', 'e1b2c3d4-0104-4000-8000-000000000104', 'd1b2c3d4-0011-4000-8000-000000000011', '{"answer": "false"}'),
  ('f1b2c3d4-0142-4000-8000-000000000142', 'e1b2c3d4-0104-4000-8000-000000000104', 'd1b2c3d4-0012-4000-8000-000000000012', '{"rating": 1}'),
  ('f1b2c3d4-0143-4000-8000-000000000143', 'e1b2c3d4-0104-4000-8000-000000000104', 'd1b2c3d4-0013-4000-8000-000000000013', '{"selected": ["Too complex"]}'),
  ('f1b2c3d4-0144-4000-8000-000000000144', 'e1b2c3d4-0104-4000-8000-000000000104', 'd1b2c3d4-0014-4000-8000-000000000014', '{"text": "Something that works offline and syncs later. Most apps need constant connection."}'),
  -- Response 5
  ('f1b2c3d4-0151-4000-8000-000000000151', 'e1b2c3d4-0105-4000-8000-000000000105', 'd1b2c3d4-0011-4000-8000-000000000011', '{"answer": "true"}'),
  ('f1b2c3d4-0152-4000-8000-000000000152', 'e1b2c3d4-0105-4000-8000-000000000105', 'd1b2c3d4-0012-4000-8000-000000000012', '{"rating": 3}'),
  ('f1b2c3d4-0153-4000-8000-000000000153', 'e1b2c3d4-0105-4000-8000-000000000105', 'd1b2c3d4-0013-4000-8000-000000000013', '{"selected": ["Too complex"]}'),
  ('f1b2c3d4-0154-4000-8000-000000000154', 'e1b2c3d4-0105-4000-8000-000000000105', 'd1b2c3d4-0014-4000-8000-000000000014', '{"text": "Customizable goals that adapt based on my progress, not static targets."}'),
  -- Response 6
  ('f1b2c3d4-0161-4000-8000-000000000161', 'e1b2c3d4-0106-4000-8000-000000000106', 'd1b2c3d4-0011-4000-8000-000000000011', '{"answer": "true"}'),
  ('f1b2c3d4-0162-4000-8000-000000000162', 'e1b2c3d4-0106-4000-8000-000000000106', 'd1b2c3d4-0012-4000-8000-000000000012', '{"rating": 2}'),
  ('f1b2c3d4-0163-4000-8000-000000000163', 'e1b2c3d4-0106-4000-8000-000000000106', 'd1b2c3d4-0013-4000-8000-000000000013', '{"selected": ["Poor accuracy"]}'),
  ('f1b2c3d4-0164-4000-8000-000000000164', 'e1b2c3d4-0106-4000-8000-000000000106', 'd1b2c3d4-0014-4000-8000-000000000014', '{"text": "Better food tracking — scanning barcodes is tedious, I want AI-powered meal recognition."}'),
  -- Response 7
  ('f1b2c3d4-0171-4000-8000-000000000171', 'e1b2c3d4-0107-4000-8000-000000000107', 'd1b2c3d4-0011-4000-8000-000000000011', '{"answer": "false"}'),
  ('f1b2c3d4-0172-4000-8000-000000000172', 'e1b2c3d4-0107-4000-8000-000000000107', 'd1b2c3d4-0012-4000-8000-000000000012', '{"rating": 2}'),
  ('f1b2c3d4-0173-4000-8000-000000000173', 'e1b2c3d4-0107-4000-8000-000000000107', 'd1b2c3d4-0013-4000-8000-000000000013', '{"selected": ["Too complex"]}'),
  ('f1b2c3d4-0174-4000-8000-000000000174', 'e1b2c3d4-0107-4000-8000-000000000107', 'd1b2c3d4-0014-4000-8000-000000000014', '{"text": "Social features where I can share achievements without it feeling forced."}'),
  -- Response 8
  ('f1b2c3d4-0181-4000-8000-000000000181', 'e1b2c3d4-0108-4000-8000-000000000108', 'd1b2c3d4-0011-4000-8000-000000000011', '{"answer": "true"}'),
  ('f1b2c3d4-0182-4000-8000-000000000182', 'e1b2c3d4-0108-4000-8000-000000000108', 'd1b2c3d4-0012-4000-8000-000000000012', '{"rating": 3}'),
  ('f1b2c3d4-0183-4000-8000-000000000183', 'e1b2c3d4-0108-4000-8000-000000000108', 'd1b2c3d4-0013-4000-8000-000000000013', '{"selected": ["Bad UX"]}'),
  ('f1b2c3d4-0184-4000-8000-000000000184', 'e1b2c3d4-0108-4000-8000-000000000108', 'd1b2c3d4-0014-4000-8000-000000000014', '{"text": "Just give me the data in a simple format I can export. No gamification needed."}')
ON CONFLICT (id) DO NOTHING;

-- Survey 2 answers (7 responses x 3 questions = 21 answers)
-- Q1 yes_no: 6/7 yes = 85.7% → strength (>70%)
-- Q2 rating:  4+5+4+4+5+3+5 = avg 4.29 → strength (>=4.0)
-- Q3 MC:     evenly split → no dominant signal
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  -- Response 1
  ('f1b2c3d4-0211-4000-8000-000000000211', 'e1b2c3d4-0201-4000-8000-000000000201', 'd1b2c3d4-0021-4000-8000-000000000021', '{"answer": "true"}'),
  ('f1b2c3d4-0212-4000-8000-000000000212', 'e1b2c3d4-0201-4000-8000-000000000201', 'd1b2c3d4-0022-4000-8000-000000000022', '{"rating": 4}'),
  ('f1b2c3d4-0213-4000-8000-000000000213', 'e1b2c3d4-0201-4000-8000-000000000201', 'd1b2c3d4-0023-4000-8000-000000000023', '{"selected": ["Free with ads"]}'),
  -- Response 2
  ('f1b2c3d4-0221-4000-8000-000000000221', 'e1b2c3d4-0202-4000-8000-000000000202', 'd1b2c3d4-0021-4000-8000-000000000021', '{"answer": "true"}'),
  ('f1b2c3d4-0222-4000-8000-000000000222', 'e1b2c3d4-0202-4000-8000-000000000202', 'd1b2c3d4-0022-4000-8000-000000000022', '{"rating": 5}'),
  ('f1b2c3d4-0223-4000-8000-000000000223', 'e1b2c3d4-0202-4000-8000-000000000202', 'd1b2c3d4-0023-4000-8000-000000000023', '{"selected": ["One-time purchase"]}'),
  -- Response 3
  ('f1b2c3d4-0231-4000-8000-000000000231', 'e1b2c3d4-0203-4000-8000-000000000203', 'd1b2c3d4-0021-4000-8000-000000000021', '{"answer": "true"}'),
  ('f1b2c3d4-0232-4000-8000-000000000232', 'e1b2c3d4-0203-4000-8000-000000000203', 'd1b2c3d4-0022-4000-8000-000000000022', '{"rating": 4}'),
  ('f1b2c3d4-0233-4000-8000-000000000233', 'e1b2c3d4-0203-4000-8000-000000000203', 'd1b2c3d4-0023-4000-8000-000000000023', '{"selected": ["Freemium"]}'),
  -- Response 4
  ('f1b2c3d4-0241-4000-8000-000000000241', 'e1b2c3d4-0204-4000-8000-000000000204', 'd1b2c3d4-0021-4000-8000-000000000021', '{"answer": "false"}'),
  ('f1b2c3d4-0242-4000-8000-000000000242', 'e1b2c3d4-0204-4000-8000-000000000204', 'd1b2c3d4-0022-4000-8000-000000000022', '{"rating": 4}'),
  ('f1b2c3d4-0243-4000-8000-000000000243', 'e1b2c3d4-0204-4000-8000-000000000204', 'd1b2c3d4-0023-4000-8000-000000000023', '{"selected": ["Free with ads"]}'),
  -- Response 5
  ('f1b2c3d4-0251-4000-8000-000000000251', 'e1b2c3d4-0205-4000-8000-000000000205', 'd1b2c3d4-0021-4000-8000-000000000021', '{"answer": "true"}'),
  ('f1b2c3d4-0252-4000-8000-000000000252', 'e1b2c3d4-0205-4000-8000-000000000205', 'd1b2c3d4-0022-4000-8000-000000000022', '{"rating": 5}'),
  ('f1b2c3d4-0253-4000-8000-000000000253', 'e1b2c3d4-0205-4000-8000-000000000205', 'd1b2c3d4-0023-4000-8000-000000000023', '{"selected": ["One-time purchase"]}'),
  -- Response 6
  ('f1b2c3d4-0261-4000-8000-000000000261', 'e1b2c3d4-0206-4000-8000-000000000206', 'd1b2c3d4-0021-4000-8000-000000000021', '{"answer": "true"}'),
  ('f1b2c3d4-0262-4000-8000-000000000262', 'e1b2c3d4-0206-4000-8000-000000000206', 'd1b2c3d4-0022-4000-8000-000000000022', '{"rating": 3}'),
  ('f1b2c3d4-0263-4000-8000-000000000263', 'e1b2c3d4-0206-4000-8000-000000000206', 'd1b2c3d4-0023-4000-8000-000000000023', '{"selected": ["Monthly subscription"]}'),
  -- Response 7
  ('f1b2c3d4-0271-4000-8000-000000000271', 'e1b2c3d4-0207-4000-8000-000000000207', 'd1b2c3d4-0021-4000-8000-000000000021', '{"answer": "true"}'),
  ('f1b2c3d4-0272-4000-8000-000000000272', 'e1b2c3d4-0207-4000-8000-000000000207', 'd1b2c3d4-0022-4000-8000-000000000022', '{"rating": 5}'),
  ('f1b2c3d4-0273-4000-8000-000000000273', 'e1b2c3d4-0207-4000-8000-000000000207', 'd1b2c3d4-0023-4000-8000-000000000023', '{"selected": ["Freemium"]}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Project Insights (4 manual insights for Alice's project)
-- ============================================================
INSERT INTO public.project_insights (id, project_id, type, content) VALUES
  ('71b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001',
   'strength',
   '75% of respondents actively track fitness — confirms existing habit and market demand.'),
  ('71b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0001-4000-8000-000000000001',
   'opportunity',
   'Current solutions score just 2.25/5 satisfaction — major gap in the market for a better experience.'),
  ('71b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0001-4000-8000-000000000001',
   'strength',
   '86% would use a combined workout + nutrition app — strong signal for the unified approach.'),
  ('71b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0001-4000-8000-000000000001',
   'decision',
   'No clear pricing preference emerged — need to run a dedicated pricing experiment before committing to a model.')
ON CONFLICT (id) DO NOTHING;

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
