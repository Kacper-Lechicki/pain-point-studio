-- Fix production schema drift caused by squash+push workflow.
-- This migration brings production in sync with the local schema.

-- ============================================================
-- 1. Add missing column: surveys.view_count
-- ============================================================
ALTER TABLE "public"."surveys"
  ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0 NOT NULL;

-- ============================================================
-- 2. Fix profiles.role — remove NOT NULL and DEFAULT from production
--    (local schema has: "role" text — nullable, no default)
-- ============================================================
ALTER TABLE "public"."profiles"
  ALTER COLUMN "role" DROP NOT NULL,
  ALTER COLUMN "role" DROP DEFAULT;

-- Drop orphaned FK to old roles lookup table (may not exist after table was dropped)
ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_role_fk";

-- ============================================================
-- 3. Fix survey_responses status constraint — add 'abandoned' status
-- ============================================================
ALTER TABLE "public"."survey_responses" DROP CONSTRAINT IF EXISTS "survey_responses_status_check";
ALTER TABLE "public"."survey_responses"
  ADD CONSTRAINT "survey_responses_status_check"
  CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text]));

-- ============================================================
-- 4. Drop orphaned indexes (created by old migrations, not in current schema)
-- ============================================================
DROP INDEX IF EXISTS "public"."survey_questions_survey_id_idx";
DROP INDEX IF EXISTS "public"."survey_responses_survey_id_idx";
DROP INDEX IF EXISTS "public"."surveys_user_id_idx";

-- ============================================================
-- 5. Drop old SELECT policies replaced by unified select_surveys / select_survey_questions
-- ============================================================

-- surveys: old granular policies replaced by "select_surveys"
DROP POLICY IF EXISTS "Users can read own surveys" ON "public"."surveys";
DROP POLICY IF EXISTS "Anyone can read active or pending surveys by slug" ON "public"."surveys";
DROP POLICY IF EXISTS "Anyone can read recently cancelled surveys by slug" ON "public"."surveys";
DROP POLICY IF EXISTS "Anyone can read recently completed surveys by slug" ON "public"."surveys";

-- survey_questions: old granular policies replaced by "select_survey_questions"
DROP POLICY IF EXISTS "Users can read questions for own surveys" ON "public"."survey_questions";
DROP POLICY IF EXISTS "Anyone can read questions for published surveys" ON "public"."survey_questions";
DROP POLICY IF EXISTS "Anyone can read questions of published surveys" ON "public"."survey_questions";
