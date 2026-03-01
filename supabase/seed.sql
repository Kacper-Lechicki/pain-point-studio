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
-- ALICE'S PROJECTS (8 diverse projects at different stages)
-- ============================================================

-- P1: Fitness Tracker App — MATURE, validated idea (90 days old)
INSERT INTO public.projects (id, user_id, name, summary, status, target_responses, created_at) VALUES
  ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001',
   'Fitness Tracker App',
   'Validating demand for a unified fitness tracking app combining workouts, nutrition, and progress analytics.',
   'active', 50, now() - interval '90 days')
ON CONFLICT (id) DO NOTHING;

-- P2: Remote Team Pulse — GROWING, collecting data (25 days old)
INSERT INTO public.projects (id, user_id, name, summary, status, target_responses, created_at) VALUES
  ('b1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000001',
   'Remote Team Pulse',
   'Exploring whether remote teams need better async check-in tools beyond standups and status updates.',
   'active', 30, now() - interval '25 days')
ON CONFLICT (id) DO NOTHING;

-- P3: Dev Portfolio Builder — FRESH, idea stage (4 days old)
INSERT INTO public.projects (id, user_id, name, summary, status, target_responses, created_at) VALUES
  ('b1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000001',
   'Dev Portfolio Builder',
   'Investigating pain points developers face when creating and maintaining portfolio websites.',
   'active', 20, now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;

-- P4: AI Recipe Generator — ARCHIVED, failed validation (75 days old)
INSERT INTO public.projects (id, user_id, name, summary, status, target_responses, archived_at, created_at) VALUES
  ('b1b2c3d4-0004-4000-8000-000000000004', 'a1b2c3d4-0001-4000-8000-000000000001',
   'AI Recipe Generator',
   'AI-powered recipe suggestions based on ingredients you already have at home.',
   'archived', 30, now() - interval '15 days', now() - interval '75 days')
ON CONFLICT (id) DO NOTHING;

-- P5: Freelance Invoice Tool — VALIDATED, strong signals (80 days old)
INSERT INTO public.projects (id, user_id, name, summary, status, target_responses, created_at) VALUES
  ('b1b2c3d4-0005-4000-8000-000000000005', 'a1b2c3d4-0001-4000-8000-000000000001',
   'Freelance Invoice Tool',
   'Simplifying invoicing, time tracking, and payment collection for solo freelancers and consultants.',
   'active', 40, now() - interval '80 days')
ON CONFLICT (id) DO NOTHING;

-- P6: Pet Health Tracker — EARLY, first survey just launched (10 days old)
INSERT INTO public.projects (id, user_id, name, summary, status, target_responses, created_at) VALUES
  ('b1b2c3d4-0006-4000-8000-000000000006', 'a1b2c3d4-0001-4000-8000-000000000001',
   'Pet Health Tracker',
   'Helping pet owners track vet visits, medications, vaccination schedules, and daily health metrics.',
   'active', 25, now() - interval '10 days')
ON CONFLICT (id) DO NOTHING;

-- P7: Local Event Discovery — STALLED, mixed signals (50 days old)
INSERT INTO public.projects (id, user_id, name, summary, status, target_responses, created_at) VALUES
  ('b1b2c3d4-0007-4000-8000-000000000007', 'a1b2c3d4-0001-4000-8000-000000000001',
   'Local Event Discovery',
   'Hyper-local event discovery platform going beyond Facebook Events for neighborhood happenings.',
   'active', 35, now() - interval '50 days')
ON CONFLICT (id) DO NOTHING;

-- P8: Sustainable Shopping Assistant — BRAND NEW (1 day old)
INSERT INTO public.projects (id, user_id, name, summary, status, target_responses, created_at) VALUES
  ('b1b2c3d4-0008-4000-8000-000000000008', 'a1b2c3d4-0001-4000-8000-000000000001',
   'Sustainable Shopping Assistant',
   'Helping conscious consumers find eco-friendly product alternatives and track their environmental impact.',
   'active', 30, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- Bob's project
INSERT INTO public.projects (id, user_id, name, summary, status, created_at) VALUES
  ('b1b2c3d4-0009-4000-8000-000000000009', 'a1b2c3d4-0002-4000-8000-000000000002',
   'API Testing Tool',
   'Exploring the market for developer-focused API testing solutions.',
   'active', now() - interval '14 days')
ON CONFLICT (id) DO NOTHING;

-- Pin Alice's Fitness Tracker project
UPDATE public.profiles SET pinned_project_id = 'b1b2c3d4-0001-4000-8000-000000000001'
WHERE id = 'a1b2c3d4-0001-4000-8000-000000000001';

-- ============================================================
-- PROJECT DESCRIPTIONS (Tiptap JSON)
-- ============================================================

-- P1: Fitness Tracker App — rich description with headings, bold, bullets
UPDATE public.projects SET description = $tiptap${
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Problem"}]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "Most fitness apps try to do everything at once — calorie counting, workout planning, sleep tracking, social features — but end up doing nothing well. Users bounce between "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "3–4 different apps"},
      {"type": "text", "text": " just to get a complete picture of their health."}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Hypothesis"}]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "A single, opinionated app that nails "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "workouts + nutrition + progress analytics"},
      {"type": "text", "text": " with a clean, developer-friendly UI can capture the underserved power-user segment who care about data ownership and simplicity over gamification."}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Target audience"}]},
    {"type": "bulletList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Tech workers who care about fitness but hate cluttered interfaces"}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Developers who want data export and API access to their health data"}]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "People switching from Fitbit/MyFitnessPal who want something minimal"}]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Key findings"}]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "Survey data confirms "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "80% of respondents actively track fitness"},
      {"type": "text", "text": " but rate current solutions only 2.0/5 satisfaction. \"Too complex\" is the dominant complaint. The $5–9/month price point is gaining early traction in our pricing experiment."}
    ]}
  ]
}$tiptap$::jsonb
WHERE id = 'b1b2c3d4-0001-4000-8000-000000000001';

-- P2: Remote Team Pulse — blockquote + paragraphs
UPDATE public.projects SET description = $tiptap${
  "type": "doc",
  "content": [
    {"type": "blockquote", "content": [
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "italic"}], "text": "\"We spend 45 minutes every morning on standups that could be a 2-minute async update.\""}]}
    ]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "That quote from a senior engineer at a 200-person remote company kicked off this research. The more I dug in, the more I found that "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "daily standups are the #1 complaint"},
      {"type": "text", "text": " among remote workers — not because check-ins are bad, but because the tooling forces synchronous rituals."}
    ]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "Existing tools like Geekbot and Standuply bolt onto Slack, but they feel like afterthoughts. There might be room for a purpose-built async pulse tool that focuses on "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "individual contributors"},
      {"type": "text", "text": " rather than managers tracking productivity."}
    ]}
  ]
}$tiptap$::jsonb
WHERE id = 'b1b2c3d4-0002-4000-8000-000000000002';

-- P3: Dev Portfolio Builder — short, just getting started
UPDATE public.projects SET description = $tiptap${
  "type": "doc",
  "content": [
    {"type": "paragraph", "content": [
      {"type": "text", "text": "Every developer knows they "},
      {"type": "text", "marks": [{"type": "italic"}], "text": "should"},
      {"type": "text", "text": " have a portfolio website, but most don't — or have one that's been outdated for 2 years. The existing solutions (GitHub Pages, Vercel templates, WordPress) either require too much design skill or too much maintenance."}
    ]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "I want to explore whether there's space for a tool that auto-generates and keeps updated a portfolio from your GitHub repos, blog posts, and work history. Think \"LinkedIn profile page, but actually good.\""}
    ]}
  ]
}$tiptap$::jsonb
WHERE id = 'b1b2c3d4-0003-4000-8000-000000000003';

-- P4: AI Recipe Generator — archived project, post-mortem feel
UPDATE public.projects SET description = $tiptap${
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Original idea"}]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "An AI-powered cooking assistant that suggests recipes based on what you actually have in your fridge. Take a photo of your ingredients, get 3 recipe ideas with step-by-step instructions adapted to your dietary preferences and skill level."}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Why it didn't work out"}]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "After running a validation survey for 25 days, only 4 people responded — and the signals were weak. Half of them don't even cook regularly. The problem turned out to be "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "real but not painful enough"},
      {"type": "text", "text": " to motivate a switch from just Googling \"recipes with chicken and broccoli\". Also, the market is flooded with free recipe apps already."}
    ]},
    {"type": "paragraph", "content": [
      {"type": "text", "marks": [{"type": "italic"}], "text": "Lesson learned: validate the intensity of the pain, not just its existence."}
    ]}
  ]
}$tiptap$::jsonb
WHERE id = 'b1b2c3d4-0004-4000-8000-000000000004';

-- P5: Freelance Invoice Tool — detailed, validated, ready for MVP
UPDATE public.projects SET description = $tiptap${
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "The pain"}]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "Solo freelancers waste "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "3–5 hours per month"},
      {"type": "text", "text": " on invoicing, payment follow-ups, and tax prep. Most use a messy combo of Google Sheets, PayPal, and email reminders. Existing tools like FreshBooks and Wave are either too expensive or built for agencies, not solo operators."}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "MVP scope"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "Based on survey validation, the MVP should focus on three core features:"}]},
    {"type": "orderedList", "content": [
      {"type": "listItem", "content": [{"type": "paragraph", "content": [
        {"type": "text", "marks": [{"type": "bold"}], "text": "One-click invoicing"},
        {"type": "text", "text": " — create and send a professional invoice in under 60 seconds"}
      ]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [
        {"type": "text", "marks": [{"type": "bold"}], "text": "Automated payment reminders"},
        {"type": "text", "text": " — the #1 requested feature, gentle nudges at 7/14/30 days overdue"}
      ]}]},
      {"type": "listItem", "content": [{"type": "paragraph", "content": [
        {"type": "text", "marks": [{"type": "bold"}], "text": "Simple time tracking"},
        {"type": "text", "text": " — start/stop timer that auto-generates line items on invoices"}
      ]}]}
    ]},
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Pricing thinking"}]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "Average willingness to pay is $8–12/month. 80% of validated respondents said they would switch from their current solution. Freemium model with a generous free tier (5 invoices/month) could work for acquisition."}
    ]}
  ]
}$tiptap$::jsonb
WHERE id = 'b1b2c3d4-0005-4000-8000-000000000005';

-- P6: Pet Health Tracker — brief, early stage
UPDATE public.projects SET description = $tiptap${
  "type": "doc",
  "content": [
    {"type": "paragraph", "content": [
      {"type": "text", "text": "My cat Luna was due for her annual vaccines last month and I completely forgot — I'd written the date on a sticky note that got lost somewhere in the kitchen. That's when I realized: there's no good, simple app for tracking pet health records."}
    ]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "Pet owners currently juggle paper records from the vet, phone reminders for medication, and mental notes about symptoms. I want to explore whether a "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "dead-simple pet health journal"},
      {"type": "text", "text": " with smart reminders could become a daily habit for pet parents."}
    ]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "Early survey is live — first responses are coming in and both respondents are pet owners who struggle with exactly this. Promising start."}
    ]}
  ]
}$tiptap$::jsonb
WHERE id = 'b1b2c3d4-0006-4000-8000-000000000006';

-- P7: Local Event Discovery — research notes, stalled
UPDATE public.projects SET description = $tiptap${
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Research notes"}]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "The hypothesis was simple: Facebook Events is dying among younger users, and there's no good replacement for discovering hyper-local things happening in your neighborhood — pop-up markets, gallery openings, pickup sports games, community workshops."}
    ]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "After surveying 5 people on discovery habits, the results are "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "mixed"},
      {"type": "text", "text": ". People "},
      {"type": "text", "marks": [{"type": "italic"}], "text": "are"},
      {"type": "text", "text": " frustrated with current options, but only moderately (3.0/5 satisfaction). More concerning: everyone uses a "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "different channel"},
      {"type": "text", "text": " — Facebook, Instagram, Meetup, newsletters, word of mouth — making aggregation really hard."}
    ]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "The pricing survey was cancelled due to zero engagement. Both respondents said they wouldn't pay for event discovery. Might need to consider a B2B pivot (selling to event organizers) rather than B2C."}
    ]}
  ]
}$tiptap$::jsonb
WHERE id = 'b1b2c3d4-0007-4000-8000-000000000007';

-- P8: Sustainable Shopping Assistant — just a seed of an idea
UPDATE public.projects SET description = $tiptap${
  "type": "doc",
  "content": [
    {"type": "paragraph", "content": [
      {"type": "text", "text": "Quick idea dump: a browser extension or app that helps you find "},
      {"type": "text", "marks": [{"type": "bold"}], "text": "eco-friendly alternatives"},
      {"type": "text", "text": " to products you're about to buy. Think of it like Honey for coupons, but for sustainability — it pops up on Amazon and suggests a greener option with a lower carbon footprint."}
    ]},
    {"type": "paragraph", "content": [
      {"type": "text", "text": "Need to research: How big is the conscious consumer market? Are people willing to change buying habits for environmental reasons, or is it just lip service? Starting surveys this week."}
    ]}
  ]
}$tiptap$::jsonb
WHERE id = 'b1b2c3d4-0008-4000-8000-000000000008';

-- ============================================================
-- SURVEYS (12 surveys across Alice's projects)
-- ============================================================

-- === P1: Fitness Tracker App (3 surveys) ===

-- S01: Problem Discovery (completed, 8 responses, 30 days ago)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, starts_at, ends_at, completed_at, view_count, created_at) VALUES
  ('c1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001',
   'Do people struggle with fitness tracking?',
   'Understanding current pain points and habits around fitness activity tracking among developers and tech workers.',
   'public', 'completed', 'fitness-pain-pts', 'idea',
   now() - interval '80 days', now() - interval '60 days', now() - interval '60 days', 47, now() - interval '85 days')
ON CONFLICT (id) DO NOTHING;

-- S02: Feature Preferences (completed, 6 responses)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, starts_at, ends_at, completed_at, view_count, created_at) VALUES
  ('c1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001',
   'Fitness app feature priorities',
   'Validating which features matter most and willingness to pay for a unified fitness tracking solution.',
   'public', 'completed', 'fitness-features', 'research',
   now() - interval '50 days', now() - interval '30 days', now() - interval '30 days', 38, now() - interval '55 days')
ON CONFLICT (id) DO NOTHING;

-- S03: Pricing Experiment (active, 3 responses so far)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, starts_at, view_count, created_at) VALUES
  ('c1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001',
   'Fitness app pricing & willingness to pay',
   'Testing different price points and monetization strategies before committing to a business model.',
   'public', 'active', 'fitness-pricing', 'validation',
   now() - interval '7 days', 19, now() - interval '10 days')
ON CONFLICT (id) DO NOTHING;

-- === P2: Remote Team Pulse (2 surveys) ===

-- S04: Check-in habits (active, 4 responses)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, starts_at, view_count, created_at) VALUES
  ('c1b2c3d4-0004-4000-8000-000000000004', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000002',
   'How do remote teams stay in sync?',
   'Discovering how distributed teams handle daily check-ins, blockers, and mood tracking without meeting fatigue.',
   'public', 'active', 'remote-sync', 'research',
   now() - interval '15 days', 28, now() - interval '20 days')
ON CONFLICT (id) DO NOTHING;

-- S05: Async tools (draft, no responses yet)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, view_count, created_at) VALUES
  ('c1b2c3d4-0005-4000-8000-000000000005', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000002',
   'Async standup tool preferences',
   'Which features would make an async standup tool worth switching to from Slack threads?',
   'private', 'draft', 'async-standups', 'research',
   0, now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- === P3: Dev Portfolio Builder (1 survey) ===

-- S06: Portfolio pain points (draft, no responses)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, view_count, created_at) VALUES
  ('c1b2c3d4-0006-4000-8000-000000000006', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0003-4000-8000-000000000003',
   'Portfolio website pain points for developers',
   'What frustrates developers most about building and maintaining personal portfolio sites?',
   'private', 'draft', 'portfolio-pains', 'idea',
   0, now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- === P4: AI Recipe Generator (1 survey — weak results) ===

-- S07: AI cooking interest (completed, only 4 responses — weak signal)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, starts_at, ends_at, completed_at, view_count, created_at) VALUES
  ('c1b2c3d4-0007-4000-8000-000000000007', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0004-4000-8000-000000000004',
   'Would you use an AI cooking assistant?',
   'Exploring interest in AI-generated recipes based on pantry contents and dietary preferences.',
   'public', 'completed', 'ai-cooking', 'idea',
   now() - interval '60 days', now() - interval '35 days', now() - interval '35 days', 52, now() - interval '65 days')
ON CONFLICT (id) DO NOTHING;

-- === P5: Freelance Invoice Tool (2 surveys — strong validation) ===

-- S08: Invoicing pain points (completed, 6 responses)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, starts_at, ends_at, completed_at, view_count, created_at) VALUES
  ('c1b2c3d4-0008-4000-8000-000000000008', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0005-4000-8000-000000000005',
   'Freelancer invoicing pain points',
   'Understanding the biggest headaches solo freelancers face when billing clients and tracking payments.',
   'public', 'completed', 'invoice-pains', 'idea',
   now() - interval '70 days', now() - interval '50 days', now() - interval '50 days', 61, now() - interval '75 days')
ON CONFLICT (id) DO NOTHING;

-- S09: Feature priorities (completed, 5 responses)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, starts_at, ends_at, completed_at, view_count, created_at) VALUES
  ('c1b2c3d4-0009-4000-8000-000000000009', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0005-4000-8000-000000000005',
   'Invoice tool features that matter most',
   'Ranking must-have vs nice-to-have features for a freelancer-first invoicing solution.',
   'public', 'completed', 'invoice-features', 'validation',
   now() - interval '40 days', now() - interval '20 days', now() - interval '20 days', 44, now() - interval '45 days')
ON CONFLICT (id) DO NOTHING;

-- === P6: Pet Health Tracker (1 survey — just launched) ===

-- S10: Pet owner habits (active, 2 responses trickling in)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, starts_at, view_count, created_at) VALUES
  ('c1b2c3d4-000a-4000-8000-00000000000a', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0006-4000-8000-000000000006',
   'How do you track your pet''s health?',
   'Understanding how pet owners currently manage vet records, medication schedules, and health observations.',
   'public', 'active', 'pet-health', 'idea',
   now() - interval '3 days', 11, now() - interval '7 days')
ON CONFLICT (id) DO NOTHING;

-- === P7: Local Event Discovery (2 surveys — mixed results) ===

-- S11: Event discovery habits (completed, 5 responses — mixed)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, starts_at, ends_at, completed_at, view_count, created_at) VALUES
  ('c1b2c3d4-000b-4000-8000-00000000000b', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0007-4000-8000-000000000007',
   'How do you discover local events?',
   'Mapping how people currently find neighborhood events, meetups, and community activities.',
   'public', 'completed', 'event-discovery', 'research',
   now() - interval '40 days', now() - interval '22 days', now() - interval '22 days', 34, now() - interval '45 days')
ON CONFLICT (id) DO NOTHING;

-- S12: Willingness to pay (cancelled — low engagement)
INSERT INTO public.surveys (id, user_id, project_id, title, description, visibility, status, slug, research_phase, starts_at, cancelled_at, view_count, created_at) VALUES
  ('c1b2c3d4-000c-4000-8000-00000000000c', 'a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0007-4000-8000-000000000007',
   'Would you pay for better event discovery?',
   'Testing willingness to pay for a premium local event discovery experience.',
   'public', 'cancelled', 'event-pay', 'validation',
   now() - interval '18 days', now() - interval '10 days', 8, now() - interval '20 days')
ON CONFLICT (id) DO NOTHING;

-- P8: Sustainable Shopping — no surveys yet (brand new project)

-- ============================================================
-- SURVEY QUESTIONS
-- ============================================================

-- S01 questions (4): yes_no, rating, MC, open_text
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-0101-4000-8000-000000000001', 'c1b2c3d4-0001-4000-8000-000000000001',
   'Do you currently track your fitness activities?', 'yes_no', true, NULL, '{}', 0),
  ('d1000000-0102-4000-8000-000000000002', 'c1b2c3d4-0001-4000-8000-000000000001',
   'How satisfied are you with your current fitness tracking solution?', 'rating_scale', true,
   'Rate from 1 (very dissatisfied) to 5 (very satisfied)',
   '{"min": 1, "max": 5, "minLabel": "Very dissatisfied", "maxLabel": "Very satisfied"}', 1),
  ('d1000000-0103-4000-8000-000000000003', 'c1b2c3d4-0001-4000-8000-000000000001',
   'What frustrates you most about current fitness trackers?', 'multiple_choice', true,
   'Select the option that applies most',
   '{"options": ["Too complex", "Missing features", "Poor accuracy", "Bad UX"]}', 2),
  ('d1000000-0104-4000-8000-000000000004', 'c1b2c3d4-0001-4000-8000-000000000001',
   'Describe your ideal fitness tracking experience', 'open_text', false,
   'Share as much detail as you like', '{"maxLength": 1000}', 3)
ON CONFLICT (id) DO NOTHING;

-- S02 questions (3): yes_no, rating, MC
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-0201-4000-8000-000000000005', 'c1b2c3d4-0002-4000-8000-000000000002',
   'Would you use an app that combines workout and nutrition tracking?', 'yes_no', true, NULL, '{}', 0),
  ('d1000000-0202-4000-8000-000000000006', 'c1b2c3d4-0002-4000-8000-000000000002',
   'How important are social/community features in a fitness app?', 'rating_scale', true,
   '1 = not important, 5 = essential',
   '{"min": 1, "max": 5, "minLabel": "Not important", "maxLabel": "Essential"}', 1),
  ('d1000000-0203-4000-8000-000000000007', 'c1b2c3d4-0002-4000-8000-000000000002',
   'Which pricing model would you prefer?', 'multiple_choice', true, NULL,
   '{"options": ["Free with ads", "One-time purchase", "Monthly subscription", "Freemium"]}', 2)
ON CONFLICT (id) DO NOTHING;

-- S03 questions (3): MC, rating, open_text
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-0301-4000-8000-000000000008', 'c1b2c3d4-0003-4000-8000-000000000003',
   'What would you pay monthly for a premium fitness app?', 'multiple_choice', true, NULL,
   '{"options": ["Nothing — free only", "$1–$4/month", "$5–$9/month", "$10+/month"]}', 0),
  ('d1000000-0302-4000-8000-000000000009', 'c1b2c3d4-0003-4000-8000-000000000003',
   'How likely are you to switch from your current fitness app?', 'rating_scale', true,
   '1 = very unlikely, 5 = definitely switching',
   '{"min": 1, "max": 5, "minLabel": "Very unlikely", "maxLabel": "Definitely"}', 1),
  ('d1000000-0303-4000-8000-000000000010', 'c1b2c3d4-0003-4000-8000-000000000003',
   'What single feature would convince you to pay for a fitness app?', 'open_text', false, NULL, '{"maxLength": 500}', 2)
ON CONFLICT (id) DO NOTHING;

-- S04 questions (3): yes_no, rating, MC
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-0401-4000-8000-000000000011', 'c1b2c3d4-0004-4000-8000-000000000004',
   'Does your team do daily standups or check-ins?', 'yes_no', true, NULL, '{}', 0),
  ('d1000000-0402-4000-8000-000000000012', 'c1b2c3d4-0004-4000-8000-000000000004',
   'How much time per day do you spend on status updates?', 'rating_scale', true,
   '1 = under 10 min, 5 = over an hour',
   '{"min": 1, "max": 5, "minLabel": "Under 10 min", "maxLabel": "Over an hour"}', 1),
  ('d1000000-0403-4000-8000-000000000013', 'c1b2c3d4-0004-4000-8000-000000000004',
   'What is the biggest pain point with your current check-in process?', 'multiple_choice', true, NULL,
   '{"options": ["Takes too long", "People forget to post", "No visibility into blockers", "Feels performative"]}', 2)
ON CONFLICT (id) DO NOTHING;

-- S05 questions (3): yes_no, MC, open_text
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-0501-4000-8000-000000000014', 'c1b2c3d4-0005-4000-8000-000000000005',
   'Would you try a dedicated async standup tool?', 'yes_no', true, NULL, '{}', 0),
  ('d1000000-0502-4000-8000-000000000015', 'c1b2c3d4-0005-4000-8000-000000000005',
   'Which integration is most important?', 'multiple_choice', true, NULL,
   '{"options": ["Slack", "Jira / Linear", "GitHub", "Google Calendar"]}', 1),
  ('d1000000-0503-4000-8000-000000000016', 'c1b2c3d4-0005-4000-8000-000000000005',
   'What would make you switch from Slack threads for standups?', 'open_text', false, NULL, '{"maxLength": 500}', 2)
ON CONFLICT (id) DO NOTHING;

-- S06 questions (3): yes_no, MC, open_text
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-0601-4000-8000-000000000017', 'c1b2c3d4-0006-4000-8000-000000000006',
   'Do you have a personal portfolio website?', 'yes_no', true, NULL, '{}', 0),
  ('d1000000-0602-4000-8000-000000000018', 'c1b2c3d4-0006-4000-8000-000000000006',
   'What frustrates you most about portfolio sites?', 'multiple_choice', true, NULL,
   '{"options": ["Design takes too long", "Hard to keep updated", "SEO and discoverability", "No good templates"]}', 1),
  ('d1000000-0603-4000-8000-000000000019', 'c1b2c3d4-0006-4000-8000-000000000006',
   'Describe your ideal portfolio creation experience', 'open_text', false, NULL, '{"maxLength": 500}', 2)
ON CONFLICT (id) DO NOTHING;

-- S07 questions (3): yes_no, rating, MC
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-0701-4000-8000-000000000020', 'c1b2c3d4-0007-4000-8000-000000000007',
   'Do you cook meals at home regularly (3+ times/week)?', 'yes_no', true, NULL, '{}', 0),
  ('d1000000-0702-4000-8000-000000000021', 'c1b2c3d4-0007-4000-8000-000000000007',
   'How often do you struggle to decide what to cook?', 'rating_scale', true,
   '1 = rarely, 5 = almost every day',
   '{"min": 1, "max": 5, "minLabel": "Rarely", "maxLabel": "Almost every day"}', 1),
  ('d1000000-0703-4000-8000-000000000022', 'c1b2c3d4-0007-4000-8000-000000000007',
   'How would you prefer to get recipe suggestions?', 'multiple_choice', true, NULL,
   '{"options": ["Type ingredients manually", "Scan fridge photo", "Meal plan for the week", "Based on dietary goals"]}', 2)
ON CONFLICT (id) DO NOTHING;

-- S08 questions (3): yes_no, rating, MC
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-0801-4000-8000-000000000023', 'c1b2c3d4-0008-4000-8000-000000000008',
   'Do you currently use a dedicated invoicing tool?', 'yes_no', true, NULL, '{}', 0),
  ('d1000000-0802-4000-8000-000000000024', 'c1b2c3d4-0008-4000-8000-000000000008',
   'How painful is your current invoicing process?', 'rating_scale', true,
   '1 = painless, 5 = extremely painful',
   '{"min": 1, "max": 5, "minLabel": "Painless", "maxLabel": "Extremely painful"}', 1),
  ('d1000000-0803-4000-8000-000000000025', 'c1b2c3d4-0008-4000-8000-000000000008',
   'What bothers you most about invoicing?', 'multiple_choice', true, NULL,
   '{"options": ["Manual data entry", "Chasing late payments", "Tax calculation confusion", "No time tracking integration"]}', 2)
ON CONFLICT (id) DO NOTHING;

-- S09 questions (3): MC, rating, yes_no
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-0901-4000-8000-000000000026', 'c1b2c3d4-0009-4000-8000-000000000009',
   'Which feature matters most in an invoicing tool?', 'multiple_choice', true, NULL,
   '{"options": ["Auto-recurring invoices", "Built-in time tracking", "Payment reminders", "Multi-currency support"]}', 0),
  ('d1000000-0902-4000-8000-000000000027', 'c1b2c3d4-0009-4000-8000-000000000009',
   'How much would you pay monthly for an all-in-one freelance billing tool?', 'rating_scale', true,
   '1 = $0 (free only), 5 = $20+/month',
   '{"min": 1, "max": 5, "minLabel": "$0", "maxLabel": "$20+/month"}', 1),
  ('d1000000-0903-4000-8000-000000000028', 'c1b2c3d4-0009-4000-8000-000000000009',
   'Would you switch from your current invoicing solution?', 'yes_no', true, NULL, '{}', 2)
ON CONFLICT (id) DO NOTHING;

-- S10 questions (3): yes_no, MC, open_text
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-1001-4000-8000-000000000029', 'c1b2c3d4-000a-4000-8000-00000000000a',
   'Do you have a pet?', 'yes_no', true, NULL, '{}', 0),
  ('d1000000-1002-4000-8000-000000000030', 'c1b2c3d4-000a-4000-8000-00000000000a',
   'How do you currently track vet visits and medications?', 'multiple_choice', true, NULL,
   '{"options": ["Paper notes", "Phone calendar reminders", "Spreadsheet", "I don''t track"]}', 1),
  ('d1000000-1003-4000-8000-000000000031', 'c1b2c3d4-000a-4000-8000-00000000000a',
   'What pet health info do you wish was easier to manage?', 'open_text', false, NULL, '{"maxLength": 500}', 2)
ON CONFLICT (id) DO NOTHING;

-- S11 questions (3): MC, rating, open_text
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-1101-4000-8000-000000000032', 'c1b2c3d4-000b-4000-8000-00000000000b',
   'How do you currently find local events?', 'multiple_choice', true, NULL,
   '{"options": ["Facebook Events", "Meetup.com", "Instagram/TikTok", "Word of mouth", "Local newsletters"]}', 0),
  ('d1000000-1102-4000-8000-000000000033', 'c1b2c3d4-000b-4000-8000-00000000000b',
   'How satisfied are you with your current event discovery methods?', 'rating_scale', true,
   '1 = very dissatisfied, 5 = very satisfied',
   '{"min": 1, "max": 5, "minLabel": "Very dissatisfied", "maxLabel": "Very satisfied"}', 1),
  ('d1000000-1103-4000-8000-000000000034', 'c1b2c3d4-000b-4000-8000-00000000000b',
   'What type of events do you wish were easier to find?', 'open_text', false, NULL, '{"maxLength": 500}', 2)
ON CONFLICT (id) DO NOTHING;

-- S12 questions (2): yes_no, MC
INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order) VALUES
  ('d1000000-1201-4000-8000-000000000035', 'c1b2c3d4-000c-4000-8000-00000000000c',
   'Would you pay for a better event discovery experience?', 'yes_no', true, NULL, '{}', 0),
  ('d1000000-1202-4000-8000-000000000036', 'c1b2c3d4-000c-4000-8000-00000000000c',
   'What would you pay monthly for event recommendations?', 'multiple_choice', true, NULL,
   '{"options": ["Nothing", "$1–$3/month", "$4–$7/month", "$8+/month"]}', 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SURVEY RESPONSES
-- ============================================================

-- S01 responses (5 completed, spread over ~20 days)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1000000-0101-4000-8000-000000000001', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now()-interval '78 days', now()-interval '78 days'+interval '4 min', 'desktop'),
  ('e1000000-0102-4000-8000-000000000002', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now()-interval '75 days', now()-interval '75 days'+interval '3 min', 'mobile'),
  ('e1000000-0103-4000-8000-000000000003', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now()-interval '72 days', now()-interval '72 days'+interval '5 min', 'desktop'),
  ('e1000000-0104-4000-8000-000000000004', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now()-interval '68 days', now()-interval '68 days'+interval '6 min', 'mobile'),
  ('e1000000-0105-4000-8000-000000000005', 'c1b2c3d4-0001-4000-8000-000000000001', 'completed', now()-interval '64 days', now()-interval '64 days'+interval '3 min', 'tablet')
ON CONFLICT (id) DO NOTHING;

-- S02 responses (6 completed)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1000000-0201-4000-8000-000000000006', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now()-interval '48 days', now()-interval '48 days'+interval '3 min', 'desktop'),
  ('e1000000-0202-4000-8000-000000000007', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now()-interval '45 days', now()-interval '45 days'+interval '5 min', 'mobile'),
  ('e1000000-0203-4000-8000-000000000008', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now()-interval '42 days', now()-interval '42 days'+interval '4 min', 'desktop'),
  ('e1000000-0204-4000-8000-000000000009', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now()-interval '38 days', now()-interval '38 days'+interval '6 min', 'mobile'),
  ('e1000000-0205-4000-8000-000000000010', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now()-interval '34 days', now()-interval '34 days'+interval '3 min', 'desktop'),
  ('e1000000-0206-4000-8000-000000000011', 'c1b2c3d4-0002-4000-8000-000000000002', 'completed', now()-interval '32 days', now()-interval '32 days'+interval '5 min', 'tablet')
ON CONFLICT (id) DO NOTHING;

-- S03 responses (3 completed — active survey)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1000000-0301-4000-8000-000000000012', 'c1b2c3d4-0003-4000-8000-000000000003', 'completed', now()-interval '5 days', now()-interval '5 days'+interval '4 min', 'desktop'),
  ('e1000000-0302-4000-8000-000000000013', 'c1b2c3d4-0003-4000-8000-000000000003', 'completed', now()-interval '3 days', now()-interval '3 days'+interval '3 min', 'mobile'),
  ('e1000000-0303-4000-8000-000000000014', 'c1b2c3d4-0003-4000-8000-000000000003', 'completed', now()-interval '1 day', now()-interval '1 day'+interval '5 min', 'desktop')
ON CONFLICT (id) DO NOTHING;

-- S04 responses (4 completed — active survey)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1000000-0401-4000-8000-000000000015', 'c1b2c3d4-0004-4000-8000-000000000004', 'completed', now()-interval '12 days', now()-interval '12 days'+interval '5 min', 'desktop'),
  ('e1000000-0402-4000-8000-000000000016', 'c1b2c3d4-0004-4000-8000-000000000004', 'completed', now()-interval '9 days', now()-interval '9 days'+interval '4 min', 'mobile'),
  ('e1000000-0403-4000-8000-000000000017', 'c1b2c3d4-0004-4000-8000-000000000004', 'completed', now()-interval '6 days', now()-interval '6 days'+interval '3 min', 'desktop'),
  ('e1000000-0404-4000-8000-000000000018', 'c1b2c3d4-0004-4000-8000-000000000004', 'completed', now()-interval '2 days', now()-interval '2 days'+interval '6 min', 'mobile')
ON CONFLICT (id) DO NOTHING;

-- S07 responses (4 completed — weak results for archived project)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1000000-0701-4000-8000-000000000019', 'c1b2c3d4-0007-4000-8000-000000000007', 'completed', now()-interval '55 days', now()-interval '55 days'+interval '2 min', 'desktop'),
  ('e1000000-0702-4000-8000-000000000020', 'c1b2c3d4-0007-4000-8000-000000000007', 'completed', now()-interval '50 days', now()-interval '50 days'+interval '3 min', 'mobile'),
  ('e1000000-0703-4000-8000-000000000021', 'c1b2c3d4-0007-4000-8000-000000000007', 'completed', now()-interval '45 days', now()-interval '45 days'+interval '4 min', 'desktop'),
  ('e1000000-0704-4000-8000-000000000022', 'c1b2c3d4-0007-4000-8000-000000000007', 'completed', now()-interval '40 days', now()-interval '40 days'+interval '2 min', 'mobile')
ON CONFLICT (id) DO NOTHING;

-- S08 responses (6 completed — strong freelance signal)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1000000-0801-4000-8000-000000000023', 'c1b2c3d4-0008-4000-8000-000000000008', 'completed', now()-interval '68 days', now()-interval '68 days'+interval '4 min', 'desktop'),
  ('e1000000-0802-4000-8000-000000000024', 'c1b2c3d4-0008-4000-8000-000000000008', 'completed', now()-interval '65 days', now()-interval '65 days'+interval '5 min', 'mobile'),
  ('e1000000-0803-4000-8000-000000000025', 'c1b2c3d4-0008-4000-8000-000000000008', 'completed', now()-interval '62 days', now()-interval '62 days'+interval '3 min', 'desktop'),
  ('e1000000-0804-4000-8000-000000000026', 'c1b2c3d4-0008-4000-8000-000000000008', 'completed', now()-interval '58 days', now()-interval '58 days'+interval '6 min', 'mobile'),
  ('e1000000-0805-4000-8000-000000000027', 'c1b2c3d4-0008-4000-8000-000000000008', 'completed', now()-interval '55 days', now()-interval '55 days'+interval '4 min', 'desktop'),
  ('e1000000-0806-4000-8000-000000000028', 'c1b2c3d4-0008-4000-8000-000000000008', 'completed', now()-interval '52 days', now()-interval '52 days'+interval '5 min', 'tablet')
ON CONFLICT (id) DO NOTHING;

-- S09 responses (5 completed)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1000000-0901-4000-8000-000000000029', 'c1b2c3d4-0009-4000-8000-000000000009', 'completed', now()-interval '38 days', now()-interval '38 days'+interval '3 min', 'desktop'),
  ('e1000000-0902-4000-8000-000000000030', 'c1b2c3d4-0009-4000-8000-000000000009', 'completed', now()-interval '35 days', now()-interval '35 days'+interval '4 min', 'mobile'),
  ('e1000000-0903-4000-8000-000000000031', 'c1b2c3d4-0009-4000-8000-000000000009', 'completed', now()-interval '30 days', now()-interval '30 days'+interval '5 min', 'desktop'),
  ('e1000000-0904-4000-8000-000000000032', 'c1b2c3d4-0009-4000-8000-000000000009', 'completed', now()-interval '25 days', now()-interval '25 days'+interval '3 min', 'mobile'),
  ('e1000000-0905-4000-8000-000000000033', 'c1b2c3d4-0009-4000-8000-000000000009', 'completed', now()-interval '22 days', now()-interval '22 days'+interval '4 min', 'desktop')
ON CONFLICT (id) DO NOTHING;

-- S10 responses (2 completed — just launched)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1000000-1001-4000-8000-000000000034', 'c1b2c3d4-000a-4000-8000-00000000000a', 'completed', now()-interval '2 days', now()-interval '2 days'+interval '3 min', 'mobile'),
  ('e1000000-1002-4000-8000-000000000035', 'c1b2c3d4-000a-4000-8000-00000000000a', 'completed', now()-interval '1 day', now()-interval '1 day'+interval '4 min', 'desktop')
ON CONFLICT (id) DO NOTHING;

-- S11 responses (5 completed — mixed signals)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1000000-1101-4000-8000-000000000036', 'c1b2c3d4-000b-4000-8000-00000000000b', 'completed', now()-interval '38 days', now()-interval '38 days'+interval '3 min', 'desktop'),
  ('e1000000-1102-4000-8000-000000000037', 'c1b2c3d4-000b-4000-8000-00000000000b', 'completed', now()-interval '34 days', now()-interval '34 days'+interval '4 min', 'mobile'),
  ('e1000000-1103-4000-8000-000000000038', 'c1b2c3d4-000b-4000-8000-00000000000b', 'completed', now()-interval '30 days', now()-interval '30 days'+interval '5 min', 'desktop'),
  ('e1000000-1104-4000-8000-000000000039', 'c1b2c3d4-000b-4000-8000-00000000000b', 'completed', now()-interval '27 days', now()-interval '27 days'+interval '3 min', 'mobile'),
  ('e1000000-1105-4000-8000-000000000040', 'c1b2c3d4-000b-4000-8000-00000000000b', 'completed', now()-interval '24 days', now()-interval '24 days'+interval '6 min', 'desktop')
ON CONFLICT (id) DO NOTHING;

-- S12 responses (2 completed before cancellation)
INSERT INTO public.survey_responses (id, survey_id, status, started_at, completed_at, device_type) VALUES
  ('e1000000-1201-4000-8000-000000000041', 'c1b2c3d4-000c-4000-8000-00000000000c', 'completed', now()-interval '16 days', now()-interval '16 days'+interval '2 min', 'desktop'),
  ('e1000000-1202-4000-8000-000000000042', 'c1b2c3d4-000c-4000-8000-00000000000c', 'completed', now()-interval '14 days', now()-interval '14 days'+interval '3 min', 'mobile')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SURVEY ANSWERS
-- ============================================================

-- S01 answers (5 responses x 4 questions = 20)
-- Q1 yes_no: 4/5 yes (80%) → strength
-- Q2 rating: 2+3+2+1+2 = avg 2.0 → threat (low satisfaction)
-- Q3 MC: "Too complex" 3/5 = dominant
-- Q4 text: varied
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  ('f1000000-0001-4000-8000-000000000001', 'e1000000-0101-4000-8000-000000000001', 'd1000000-0101-4000-8000-000000000001', '{"answer": "true"}'),
  ('f1000000-0002-4000-8000-000000000002', 'e1000000-0101-4000-8000-000000000001', 'd1000000-0102-4000-8000-000000000002', '{"rating": 2}'),
  ('f1000000-0003-4000-8000-000000000003', 'e1000000-0101-4000-8000-000000000001', 'd1000000-0103-4000-8000-000000000003', '{"selected": ["Too complex"]}'),
  ('f1000000-0004-4000-8000-000000000004', 'e1000000-0101-4000-8000-000000000001', 'd1000000-0104-4000-8000-000000000004', '{"text": "I want something simple that just tracks steps and calories without all the clutter."}'),
  ('f1000000-0005-4000-8000-000000000005', 'e1000000-0102-4000-8000-000000000002', 'd1000000-0101-4000-8000-000000000001', '{"answer": "true"}'),
  ('f1000000-0006-4000-8000-000000000006', 'e1000000-0102-4000-8000-000000000002', 'd1000000-0102-4000-8000-000000000002', '{"rating": 3}'),
  ('f1000000-0007-4000-8000-000000000007', 'e1000000-0102-4000-8000-000000000002', 'd1000000-0103-4000-8000-000000000003', '{"selected": ["Too complex"]}'),
  ('f1000000-0008-4000-8000-000000000008', 'e1000000-0102-4000-8000-000000000002', 'd1000000-0104-4000-8000-000000000004', '{"text": "Integration with gym equipment and automatic workout detection would be game-changing."}'),
  ('f1000000-0009-4000-8000-000000000009', 'e1000000-0103-4000-8000-000000000003', 'd1000000-0101-4000-8000-000000000001', '{"answer": "true"}'),
  ('f1000000-0010-4000-8000-000000000010', 'e1000000-0103-4000-8000-000000000003', 'd1000000-0102-4000-8000-000000000002', '{"rating": 2}'),
  ('f1000000-0011-4000-8000-000000000011', 'e1000000-0103-4000-8000-000000000003', 'd1000000-0103-4000-8000-000000000003', '{"selected": ["Missing features"]}'),
  ('f1000000-0012-4000-8000-000000000012', 'e1000000-0103-4000-8000-000000000003', 'd1000000-0104-4000-8000-000000000004', '{"text": "A clean dashboard showing weekly trends, not just daily numbers."}'),
  ('f1000000-0013-4000-8000-000000000013', 'e1000000-0104-4000-8000-000000000004', 'd1000000-0101-4000-8000-000000000001', '{"answer": "false"}'),
  ('f1000000-0014-4000-8000-000000000014', 'e1000000-0104-4000-8000-000000000004', 'd1000000-0102-4000-8000-000000000002', '{"rating": 1}'),
  ('f1000000-0015-4000-8000-000000000015', 'e1000000-0104-4000-8000-000000000004', 'd1000000-0103-4000-8000-000000000003', '{"selected": ["Too complex"]}'),
  ('f1000000-0016-4000-8000-000000000016', 'e1000000-0104-4000-8000-000000000004', 'd1000000-0104-4000-8000-000000000004', '{"text": "Something that works offline and syncs later. Most apps need constant connection."}'),
  ('f1000000-0017-4000-8000-000000000017', 'e1000000-0105-4000-8000-000000000005', 'd1000000-0101-4000-8000-000000000001', '{"answer": "true"}'),
  ('f1000000-0018-4000-8000-000000000018', 'e1000000-0105-4000-8000-000000000005', 'd1000000-0102-4000-8000-000000000002', '{"rating": 2}'),
  ('f1000000-0019-4000-8000-000000000019', 'e1000000-0105-4000-8000-000000000005', 'd1000000-0103-4000-8000-000000000003', '{"selected": ["Poor accuracy"]}'),
  ('f1000000-0020-4000-8000-000000000020', 'e1000000-0105-4000-8000-000000000005', 'd1000000-0104-4000-8000-000000000004', '{"text": "Better food tracking with AI-powered meal recognition instead of manual barcode scanning."}')
ON CONFLICT (id) DO NOTHING;

-- S02 answers (6 responses x 3 questions = 18)
-- Q1 yes_no: 5/6 yes (83%) → strength
-- Q2 rating: 4+5+4+3+5+4 = avg 4.17 → strength
-- Q3 MC: spread across options
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  ('f1000000-0021-4000-8000-000000000021', 'e1000000-0201-4000-8000-000000000006', 'd1000000-0201-4000-8000-000000000005', '{"answer": "true"}'),
  ('f1000000-0022-4000-8000-000000000022', 'e1000000-0201-4000-8000-000000000006', 'd1000000-0202-4000-8000-000000000006', '{"rating": 4}'),
  ('f1000000-0023-4000-8000-000000000023', 'e1000000-0201-4000-8000-000000000006', 'd1000000-0203-4000-8000-000000000007', '{"selected": ["Free with ads"]}'),
  ('f1000000-0024-4000-8000-000000000024', 'e1000000-0202-4000-8000-000000000007', 'd1000000-0201-4000-8000-000000000005', '{"answer": "true"}'),
  ('f1000000-0025-4000-8000-000000000025', 'e1000000-0202-4000-8000-000000000007', 'd1000000-0202-4000-8000-000000000006', '{"rating": 5}'),
  ('f1000000-0026-4000-8000-000000000026', 'e1000000-0202-4000-8000-000000000007', 'd1000000-0203-4000-8000-000000000007', '{"selected": ["One-time purchase"]}'),
  ('f1000000-0027-4000-8000-000000000027', 'e1000000-0203-4000-8000-000000000008', 'd1000000-0201-4000-8000-000000000005', '{"answer": "true"}'),
  ('f1000000-0028-4000-8000-000000000028', 'e1000000-0203-4000-8000-000000000008', 'd1000000-0202-4000-8000-000000000006', '{"rating": 4}'),
  ('f1000000-0029-4000-8000-000000000029', 'e1000000-0203-4000-8000-000000000008', 'd1000000-0203-4000-8000-000000000007', '{"selected": ["Freemium"]}'),
  ('f1000000-0030-4000-8000-000000000030', 'e1000000-0204-4000-8000-000000000009', 'd1000000-0201-4000-8000-000000000005', '{"answer": "false"}'),
  ('f1000000-0031-4000-8000-000000000031', 'e1000000-0204-4000-8000-000000000009', 'd1000000-0202-4000-8000-000000000006', '{"rating": 3}'),
  ('f1000000-0032-4000-8000-000000000032', 'e1000000-0204-4000-8000-000000000009', 'd1000000-0203-4000-8000-000000000007', '{"selected": ["Free with ads"]}'),
  ('f1000000-0033-4000-8000-000000000033', 'e1000000-0205-4000-8000-000000000010', 'd1000000-0201-4000-8000-000000000005', '{"answer": "true"}'),
  ('f1000000-0034-4000-8000-000000000034', 'e1000000-0205-4000-8000-000000000010', 'd1000000-0202-4000-8000-000000000006', '{"rating": 5}'),
  ('f1000000-0035-4000-8000-000000000035', 'e1000000-0205-4000-8000-000000000010', 'd1000000-0203-4000-8000-000000000007', '{"selected": ["One-time purchase"]}'),
  ('f1000000-0036-4000-8000-000000000036', 'e1000000-0206-4000-8000-000000000011', 'd1000000-0201-4000-8000-000000000005', '{"answer": "true"}'),
  ('f1000000-0037-4000-8000-000000000037', 'e1000000-0206-4000-8000-000000000011', 'd1000000-0202-4000-8000-000000000006', '{"rating": 4}'),
  ('f1000000-0038-4000-8000-000000000038', 'e1000000-0206-4000-8000-000000000011', 'd1000000-0203-4000-8000-000000000007', '{"selected": ["Monthly subscription"]}')
ON CONFLICT (id) DO NOTHING;

-- S03 answers (3 responses x 3 questions = 9)
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  ('f1000000-0039-4000-8000-000000000039', 'e1000000-0301-4000-8000-000000000012', 'd1000000-0301-4000-8000-000000000008', '{"selected": ["$5–$9/month"]}'),
  ('f1000000-0040-4000-8000-000000000040', 'e1000000-0301-4000-8000-000000000012', 'd1000000-0302-4000-8000-000000000009', '{"rating": 4}'),
  ('f1000000-0041-4000-8000-000000000041', 'e1000000-0301-4000-8000-000000000012', 'd1000000-0303-4000-8000-000000000010', '{"text": "AI-powered workout recommendations that adapt to my schedule and energy levels."}'),
  ('f1000000-0042-4000-8000-000000000042', 'e1000000-0302-4000-8000-000000000013', 'd1000000-0301-4000-8000-000000000008', '{"selected": ["$1–$4/month"]}'),
  ('f1000000-0043-4000-8000-000000000043', 'e1000000-0302-4000-8000-000000000013', 'd1000000-0302-4000-8000-000000000009', '{"rating": 3}'),
  ('f1000000-0044-4000-8000-000000000044', 'e1000000-0302-4000-8000-000000000013', 'd1000000-0303-4000-8000-000000000010', '{"text": "Seamless integration with my Apple Watch without needing the phone nearby."}'),
  ('f1000000-0045-4000-8000-000000000045', 'e1000000-0303-4000-8000-000000000014', 'd1000000-0301-4000-8000-000000000008', '{"selected": ["$5–$9/month"]}'),
  ('f1000000-0046-4000-8000-000000000046', 'e1000000-0303-4000-8000-000000000014', 'd1000000-0302-4000-8000-000000000009', '{"rating": 4}'),
  ('f1000000-0047-4000-8000-000000000047', 'e1000000-0303-4000-8000-000000000014', 'd1000000-0303-4000-8000-000000000010', '{"text": "Progress photos with automatic body composition analysis."}')
ON CONFLICT (id) DO NOTHING;

-- S04 answers (4 responses x 3 questions = 12)
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  ('f1000000-0048-4000-8000-000000000048', 'e1000000-0401-4000-8000-000000000015', 'd1000000-0401-4000-8000-000000000011', '{"answer": "true"}'),
  ('f1000000-0049-4000-8000-000000000049', 'e1000000-0401-4000-8000-000000000015', 'd1000000-0402-4000-8000-000000000012', '{"rating": 3}'),
  ('f1000000-0050-4000-8000-000000000050', 'e1000000-0401-4000-8000-000000000015', 'd1000000-0403-4000-8000-000000000013', '{"selected": ["Takes too long"]}'),
  ('f1000000-0051-4000-8000-000000000051', 'e1000000-0402-4000-8000-000000000016', 'd1000000-0401-4000-8000-000000000011', '{"answer": "true"}'),
  ('f1000000-0052-4000-8000-000000000052', 'e1000000-0402-4000-8000-000000000016', 'd1000000-0402-4000-8000-000000000012', '{"rating": 4}'),
  ('f1000000-0053-4000-8000-000000000053', 'e1000000-0402-4000-8000-000000000016', 'd1000000-0403-4000-8000-000000000013', '{"selected": ["Feels performative"]}'),
  ('f1000000-0054-4000-8000-000000000054', 'e1000000-0403-4000-8000-000000000017', 'd1000000-0401-4000-8000-000000000011', '{"answer": "false"}'),
  ('f1000000-0055-4000-8000-000000000055', 'e1000000-0403-4000-8000-000000000017', 'd1000000-0402-4000-8000-000000000012', '{"rating": 2}'),
  ('f1000000-0056-4000-8000-000000000056', 'e1000000-0403-4000-8000-000000000017', 'd1000000-0403-4000-8000-000000000013', '{"selected": ["No visibility into blockers"]}'),
  ('f1000000-0057-4000-8000-000000000057', 'e1000000-0404-4000-8000-000000000018', 'd1000000-0401-4000-8000-000000000011', '{"answer": "true"}'),
  ('f1000000-0058-4000-8000-000000000058', 'e1000000-0404-4000-8000-000000000018', 'd1000000-0402-4000-8000-000000000012', '{"rating": 4}'),
  ('f1000000-0059-4000-8000-000000000059', 'e1000000-0404-4000-8000-000000000018', 'd1000000-0403-4000-8000-000000000013', '{"selected": ["People forget to post"]}')
ON CONFLICT (id) DO NOTHING;

-- S07 answers (4 responses x 3 questions = 12) — WEAK signals for archived project
-- Q1 yes_no: 2/4 yes (50%) → not strong enough
-- Q2 rating: 2+3+2+1 = avg 2.0 → low need
-- Q3 MC: scattered
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  ('f1000000-0060-4000-8000-000000000060', 'e1000000-0701-4000-8000-000000000019', 'd1000000-0701-4000-8000-000000000020', '{"answer": "true"}'),
  ('f1000000-0061-4000-8000-000000000061', 'e1000000-0701-4000-8000-000000000019', 'd1000000-0702-4000-8000-000000000021', '{"rating": 2}'),
  ('f1000000-0062-4000-8000-000000000062', 'e1000000-0701-4000-8000-000000000019', 'd1000000-0703-4000-8000-000000000022', '{"selected": ["Type ingredients manually"]}'),
  ('f1000000-0063-4000-8000-000000000063', 'e1000000-0702-4000-8000-000000000020', 'd1000000-0701-4000-8000-000000000020', '{"answer": "false"}'),
  ('f1000000-0064-4000-8000-000000000064', 'e1000000-0702-4000-8000-000000000020', 'd1000000-0702-4000-8000-000000000021', '{"rating": 3}'),
  ('f1000000-0065-4000-8000-000000000065', 'e1000000-0702-4000-8000-000000000020', 'd1000000-0703-4000-8000-000000000022', '{"selected": ["Based on dietary goals"]}'),
  ('f1000000-0066-4000-8000-000000000066', 'e1000000-0703-4000-8000-000000000021', 'd1000000-0701-4000-8000-000000000020', '{"answer": "true"}'),
  ('f1000000-0067-4000-8000-000000000067', 'e1000000-0703-4000-8000-000000000021', 'd1000000-0702-4000-8000-000000000021', '{"rating": 2}'),
  ('f1000000-0068-4000-8000-000000000068', 'e1000000-0703-4000-8000-000000000021', 'd1000000-0703-4000-8000-000000000022', '{"selected": ["Meal plan for the week"]}'),
  ('f1000000-0069-4000-8000-000000000069', 'e1000000-0704-4000-8000-000000000022', 'd1000000-0701-4000-8000-000000000020', '{"answer": "false"}'),
  ('f1000000-0070-4000-8000-000000000070', 'e1000000-0704-4000-8000-000000000022', 'd1000000-0702-4000-8000-000000000021', '{"rating": 1}'),
  ('f1000000-0071-4000-8000-000000000071', 'e1000000-0704-4000-8000-000000000022', 'd1000000-0703-4000-8000-000000000022', '{"selected": ["Scan fridge photo"]}')
ON CONFLICT (id) DO NOTHING;

-- S08 answers (6 responses x 3 questions = 18) — STRONG freelance signal
-- Q1 yes_no: 2/6 yes (33%) → most use spreadsheets/nothing → opportunity
-- Q2 rating: 4+5+4+5+3+4 = avg 4.17 → strong pain
-- Q3 MC: "Chasing late payments" 3/6 = dominant
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  ('f1000000-0072-4000-8000-000000000072', 'e1000000-0801-4000-8000-000000000023', 'd1000000-0801-4000-8000-000000000023', '{"answer": "false"}'),
  ('f1000000-0073-4000-8000-000000000073', 'e1000000-0801-4000-8000-000000000023', 'd1000000-0802-4000-8000-000000000024', '{"rating": 4}'),
  ('f1000000-0074-4000-8000-000000000074', 'e1000000-0801-4000-8000-000000000023', 'd1000000-0803-4000-8000-000000000025', '{"selected": ["Chasing late payments"]}'),
  ('f1000000-0075-4000-8000-000000000075', 'e1000000-0802-4000-8000-000000000024', 'd1000000-0801-4000-8000-000000000023', '{"answer": "false"}'),
  ('f1000000-0076-4000-8000-000000000076', 'e1000000-0802-4000-8000-000000000024', 'd1000000-0802-4000-8000-000000000024', '{"rating": 5}'),
  ('f1000000-0077-4000-8000-000000000077', 'e1000000-0802-4000-8000-000000000024', 'd1000000-0803-4000-8000-000000000025', '{"selected": ["Manual data entry"]}'),
  ('f1000000-0078-4000-8000-000000000078', 'e1000000-0803-4000-8000-000000000025', 'd1000000-0801-4000-8000-000000000023', '{"answer": "true"}'),
  ('f1000000-0079-4000-8000-000000000079', 'e1000000-0803-4000-8000-000000000025', 'd1000000-0802-4000-8000-000000000024', '{"rating": 4}'),
  ('f1000000-0080-4000-8000-000000000080', 'e1000000-0803-4000-8000-000000000025', 'd1000000-0803-4000-8000-000000000025', '{"selected": ["Chasing late payments"]}'),
  ('f1000000-0081-4000-8000-000000000081', 'e1000000-0804-4000-8000-000000000026', 'd1000000-0801-4000-8000-000000000023', '{"answer": "false"}'),
  ('f1000000-0082-4000-8000-000000000082', 'e1000000-0804-4000-8000-000000000026', 'd1000000-0802-4000-8000-000000000024', '{"rating": 5}'),
  ('f1000000-0083-4000-8000-000000000083', 'e1000000-0804-4000-8000-000000000026', 'd1000000-0803-4000-8000-000000000025', '{"selected": ["Tax calculation confusion"]}'),
  ('f1000000-0084-4000-8000-000000000084', 'e1000000-0805-4000-8000-000000000027', 'd1000000-0801-4000-8000-000000000023', '{"answer": "true"}'),
  ('f1000000-0085-4000-8000-000000000085', 'e1000000-0805-4000-8000-000000000027', 'd1000000-0802-4000-8000-000000000024', '{"rating": 3}'),
  ('f1000000-0086-4000-8000-000000000086', 'e1000000-0805-4000-8000-000000000027', 'd1000000-0803-4000-8000-000000000025', '{"selected": ["Chasing late payments"]}'),
  ('f1000000-0087-4000-8000-000000000087', 'e1000000-0806-4000-8000-000000000028', 'd1000000-0801-4000-8000-000000000023', '{"answer": "false"}'),
  ('f1000000-0088-4000-8000-000000000088', 'e1000000-0806-4000-8000-000000000028', 'd1000000-0802-4000-8000-000000000024', '{"rating": 4}'),
  ('f1000000-0089-4000-8000-000000000089', 'e1000000-0806-4000-8000-000000000028', 'd1000000-0803-4000-8000-000000000025', '{"selected": ["No time tracking integration"]}')
ON CONFLICT (id) DO NOTHING;

-- S09 answers (5 responses x 3 questions = 15) — validates feature priorities
-- Q1 MC: "Payment reminders" 3/5 dominant
-- Q2 rating: 3+4+3+4+5 = avg 3.8 → willingness to pay
-- Q3 yes_no: 4/5 yes (80%) → strength
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  ('f1000000-0090-4000-8000-000000000090', 'e1000000-0901-4000-8000-000000000029', 'd1000000-0901-4000-8000-000000000026', '{"selected": ["Payment reminders"]}'),
  ('f1000000-0091-4000-8000-000000000091', 'e1000000-0901-4000-8000-000000000029', 'd1000000-0902-4000-8000-000000000027', '{"rating": 3}'),
  ('f1000000-0092-4000-8000-000000000092', 'e1000000-0901-4000-8000-000000000029', 'd1000000-0903-4000-8000-000000000028', '{"answer": "true"}'),
  ('f1000000-0093-4000-8000-000000000093', 'e1000000-0902-4000-8000-000000000030', 'd1000000-0901-4000-8000-000000000026', '{"selected": ["Built-in time tracking"]}'),
  ('f1000000-0094-4000-8000-000000000094', 'e1000000-0902-4000-8000-000000000030', 'd1000000-0902-4000-8000-000000000027', '{"rating": 4}'),
  ('f1000000-0095-4000-8000-000000000095', 'e1000000-0902-4000-8000-000000000030', 'd1000000-0903-4000-8000-000000000028', '{"answer": "true"}'),
  ('f1000000-0096-4000-8000-000000000096', 'e1000000-0903-4000-8000-000000000031', 'd1000000-0901-4000-8000-000000000026', '{"selected": ["Payment reminders"]}'),
  ('f1000000-0097-4000-8000-000000000097', 'e1000000-0903-4000-8000-000000000031', 'd1000000-0902-4000-8000-000000000027', '{"rating": 3}'),
  ('f1000000-0098-4000-8000-000000000098', 'e1000000-0903-4000-8000-000000000031', 'd1000000-0903-4000-8000-000000000028', '{"answer": "true"}'),
  ('f1000000-0099-4000-8000-000000000099', 'e1000000-0904-4000-8000-000000000032', 'd1000000-0901-4000-8000-000000000026', '{"selected": ["Payment reminders"]}'),
  ('f1000000-0100-4000-8000-000000000100', 'e1000000-0904-4000-8000-000000000032', 'd1000000-0902-4000-8000-000000000027', '{"rating": 4}'),
  ('f1000000-0101-4000-8000-000000000101', 'e1000000-0904-4000-8000-000000000032', 'd1000000-0903-4000-8000-000000000028', '{"answer": "true"}'),
  ('f1000000-0102-4000-8000-000000000102', 'e1000000-0905-4000-8000-000000000033', 'd1000000-0901-4000-8000-000000000026', '{"selected": ["Auto-recurring invoices"]}'),
  ('f1000000-0103-4000-8000-000000000103', 'e1000000-0905-4000-8000-000000000033', 'd1000000-0902-4000-8000-000000000027', '{"rating": 5}'),
  ('f1000000-0104-4000-8000-000000000104', 'e1000000-0905-4000-8000-000000000033', 'd1000000-0903-4000-8000-000000000028', '{"answer": "false"}')
ON CONFLICT (id) DO NOTHING;

-- S10 answers (2 responses x 3 questions = 6) — early pet tracker data
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  ('f1000000-0105-4000-8000-000000000105', 'e1000000-1001-4000-8000-000000000034', 'd1000000-1001-4000-8000-000000000029', '{"answer": "true"}'),
  ('f1000000-0106-4000-8000-000000000106', 'e1000000-1001-4000-8000-000000000034', 'd1000000-1002-4000-8000-000000000030', '{"selected": ["Phone calendar reminders"]}'),
  ('f1000000-0107-4000-8000-000000000107', 'e1000000-1001-4000-8000-000000000034', 'd1000000-1003-4000-8000-000000000031', '{"text": "Vaccination schedules and medication dosage history in one place."}'),
  ('f1000000-0108-4000-8000-000000000108', 'e1000000-1002-4000-8000-000000000035', 'd1000000-1001-4000-8000-000000000029', '{"answer": "true"}'),
  ('f1000000-0109-4000-8000-000000000109', 'e1000000-1002-4000-8000-000000000035', 'd1000000-1002-4000-8000-000000000030', '{"selected": ["Paper notes"]}'),
  ('f1000000-0110-4000-8000-000000000110', 'e1000000-1002-4000-8000-000000000035', 'd1000000-1003-4000-8000-000000000031', '{"text": "Sharing health records easily with a new vet when switching clinics."}')
ON CONFLICT (id) DO NOTHING;

-- S11 answers (5 responses x 3 questions = 15) — mixed event discovery signals
-- Q1 MC: scattered across options → no dominant channel
-- Q2 rating: 3+3+4+2+3 = avg 3.0 → neutral (not strongly dissatisfied)
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  ('f1000000-0111-4000-8000-000000000111', 'e1000000-1101-4000-8000-000000000036', 'd1000000-1101-4000-8000-000000000032', '{"selected": ["Facebook Events"]}'),
  ('f1000000-0112-4000-8000-000000000112', 'e1000000-1101-4000-8000-000000000036', 'd1000000-1102-4000-8000-000000000033', '{"rating": 3}'),
  ('f1000000-0113-4000-8000-000000000113', 'e1000000-1101-4000-8000-000000000036', 'd1000000-1103-4000-8000-000000000034', '{"text": "Small neighborhood meetups and pop-up markets."}'),
  ('f1000000-0114-4000-8000-000000000114', 'e1000000-1102-4000-8000-000000000037', 'd1000000-1101-4000-8000-000000000032', '{"selected": ["Word of mouth"]}'),
  ('f1000000-0115-4000-8000-000000000115', 'e1000000-1102-4000-8000-000000000037', 'd1000000-1102-4000-8000-000000000033', '{"rating": 3}'),
  ('f1000000-0116-4000-8000-000000000116', 'e1000000-1102-4000-8000-000000000037', 'd1000000-1103-4000-8000-000000000034', '{"text": "Live music gigs at bars — I always find out too late."}'),
  ('f1000000-0117-4000-8000-000000000117', 'e1000000-1103-4000-8000-000000000038', 'd1000000-1101-4000-8000-000000000032', '{"selected": ["Instagram/TikTok"]}'),
  ('f1000000-0118-4000-8000-000000000118', 'e1000000-1103-4000-8000-000000000038', 'd1000000-1102-4000-8000-000000000033', '{"rating": 4}'),
  ('f1000000-0119-4000-8000-000000000119', 'e1000000-1103-4000-8000-000000000038', 'd1000000-1103-4000-8000-000000000034', '{"text": "Art gallery openings and community workshops."}'),
  ('f1000000-0120-4000-8000-000000000120', 'e1000000-1104-4000-8000-000000000039', 'd1000000-1101-4000-8000-000000000032', '{"selected": ["Meetup.com"]}'),
  ('f1000000-0121-4000-8000-000000000121', 'e1000000-1104-4000-8000-000000000039', 'd1000000-1102-4000-8000-000000000033', '{"rating": 2}'),
  ('f1000000-0122-4000-8000-000000000122', 'e1000000-1104-4000-8000-000000000039', 'd1000000-1103-4000-8000-000000000034', '{"text": "Tech meetups and hackathons that aren''t just in downtown."}'),
  ('f1000000-0123-4000-8000-000000000123', 'e1000000-1105-4000-8000-000000000040', 'd1000000-1101-4000-8000-000000000032', '{"selected": ["Local newsletters"]}'),
  ('f1000000-0124-4000-8000-000000000124', 'e1000000-1105-4000-8000-000000000040', 'd1000000-1102-4000-8000-000000000033', '{"rating": 3}'),
  ('f1000000-0125-4000-8000-000000000125', 'e1000000-1105-4000-8000-000000000040', 'd1000000-1103-4000-8000-000000000034', '{"text": "Family-friendly weekend activities that aren''t just in parks."}')
ON CONFLICT (id) DO NOTHING;

-- S12 answers (2 responses x 2 questions = 4) — cancelled survey, low engagement
INSERT INTO public.survey_answers (id, response_id, question_id, value) VALUES
  ('f1000000-0126-4000-8000-000000000126', 'e1000000-1201-4000-8000-000000000041', 'd1000000-1201-4000-8000-000000000035', '{"answer": "false"}'),
  ('f1000000-0127-4000-8000-000000000127', 'e1000000-1201-4000-8000-000000000041', 'd1000000-1202-4000-8000-000000000036', '{"selected": ["Nothing"]}'),
  ('f1000000-0128-4000-8000-000000000128', 'e1000000-1202-4000-8000-000000000042', 'd1000000-1201-4000-8000-000000000035', '{"answer": "false"}'),
  ('f1000000-0129-4000-8000-000000000129', 'e1000000-1202-4000-8000-000000000042', 'd1000000-1202-4000-8000-000000000036', '{"selected": ["$1–$3/month"]}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PROJECT INSIGHTS
-- ============================================================

-- P1: Fitness Tracker App — mature project with multiple insights
INSERT INTO public.project_insights (id, project_id, type, content) VALUES
  ('11000000-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 'strength',
   '80% of respondents actively track fitness — confirms existing habit and market demand.'),
  ('11000000-0002-4000-8000-000000000002', 'b1b2c3d4-0001-4000-8000-000000000001', 'opportunity',
   'Current solutions score just 2.0/5 satisfaction — massive gap in the market for a simpler experience.'),
  ('11000000-0003-4000-8000-000000000003', 'b1b2c3d4-0001-4000-8000-000000000001', 'strength',
   '83% would use a combined workout + nutrition app — strong signal for the unified approach.'),
  ('11000000-0004-4000-8000-000000000004', 'b1b2c3d4-0001-4000-8000-000000000001', 'decision',
   '$5–9/month price point shows strongest traction. Run targeted pricing page test next.')
ON CONFLICT (id) DO NOTHING;

-- P2: Remote Team Pulse — early observation
INSERT INTO public.project_insights (id, project_id, type, content) VALUES
  ('11000000-0005-4000-8000-000000000005', 'b1b2c3d4-0002-4000-8000-000000000002', 'opportunity',
   'Most standup tools focus on managers, not individual contributors. Could be a positioning angle.')
ON CONFLICT (id) DO NOTHING;

-- P4: AI Recipe Generator — archived with failure insights
INSERT INTO public.project_insights (id, project_id, type, content) VALUES
  ('11000000-0006-4000-8000-000000000006', 'b1b2c3d4-0004-4000-8000-000000000004', 'threat',
   'Only 50% cook regularly and struggle to decide — the problem exists but is not painful enough to pay for.'),
  ('11000000-0007-4000-8000-000000000007', 'b1b2c3d4-0004-4000-8000-000000000004', 'decision',
   'Archived project after weak validation. Only 4 responses in 25 days, no dominant feature preference.')
ON CONFLICT (id) DO NOTHING;

-- P5: Freelance Invoice Tool — validated with strong signals
INSERT INTO public.project_insights (id, project_id, type, content) VALUES
  ('11000000-0008-4000-8000-000000000008', 'b1b2c3d4-0005-4000-8000-000000000005', 'strength',
   '67% of freelancers have no dedicated invoicing tool — huge underserved market.'),
  ('11000000-0009-4000-8000-000000000009', 'b1b2c3d4-0005-4000-8000-000000000005', 'strength',
   'Average pain score 4.17/5 — invoicing is a genuine, deeply felt pain point.'),
  ('11000000-0010-4000-8000-000000000010', 'b1b2c3d4-0005-4000-8000-000000000005', 'opportunity',
   'Payment reminders is the #1 requested feature. Build MVP around automated follow-ups.'),
  ('11000000-0011-4000-8000-000000000011', 'b1b2c3d4-0005-4000-8000-000000000005', 'decision',
   'Strong validation across both surveys. Ready to start MVP — focus on invoicing + payment reminders first.')
ON CONFLICT (id) DO NOTHING;

-- P7: Local Event Discovery — stalled with mixed signals
INSERT INTO public.project_insights (id, project_id, type, content) VALUES
  ('11000000-0012-4000-8000-000000000012', 'b1b2c3d4-0007-4000-8000-000000000007', 'threat',
   'Average satisfaction 3.0/5 with current solutions — people are mildly dissatisfied but not desperate.'),
  ('11000000-0013-4000-8000-000000000013', 'b1b2c3d4-0007-4000-8000-000000000007', 'threat',
   'Both respondents to the pricing survey said they would not pay. Cancelled survey due to low engagement.'),
  ('11000000-0014-4000-8000-000000000014', 'b1b2c3d4-0007-4000-8000-000000000007', 'decision',
   'Unclear market fit. Consider pivoting to B2B (event organizers) instead of consumer discovery.')
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
