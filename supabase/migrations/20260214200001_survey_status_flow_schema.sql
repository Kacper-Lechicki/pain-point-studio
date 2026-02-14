-- Survey Status Flow (part 2): columns, RLS policies, and pg_cron jobs
--
-- New columns:
--   closed_at      — when survey was closed (natural finish)
--   cancelled_at   — when survey was cancelled (withdrawal)
--   archived_at    — when survey was archived (for 30-day TTL)
--   previous_status — status before archiving (for restore)

-- 1. Add timestamp and tracking columns
ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS previous_status public.survey_status;

-- 2. Backfill timestamps for existing rows
UPDATE public.surveys SET closed_at = updated_at WHERE status = 'closed' AND closed_at IS NULL;
UPDATE public.surveys SET archived_at = updated_at WHERE status = 'archived' AND archived_at IS NULL;

-- 3. Update RLS: allow public read for pending + closed surveys by slug
--    (pending shows countdown, closed shows "survey ended")
DROP POLICY IF EXISTS "Anyone can read active surveys by slug" ON public.surveys;
CREATE POLICY "Anyone can read published surveys by slug"
  ON public.surveys FOR SELECT
  USING (status IN ('active', 'pending', 'closed') AND slug IS NOT NULL);

-- 4. Update RLS: questions readable for pending surveys too (prefetch for countdown)
DROP POLICY IF EXISTS "Anyone can read questions for active surveys" ON public.survey_questions;
CREATE POLICY "Anyone can read questions for published surveys"
  ON public.survey_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.surveys
    WHERE surveys.id = survey_questions.survey_id
      AND surveys.status IN ('active', 'pending', 'closed')
      AND surveys.slug IS NOT NULL
  ));

-- 5. Allow reading cancelled surveys by slug for 30-day withdrawal message
CREATE POLICY "Anyone can read recently cancelled surveys by slug"
  ON public.surveys FOR SELECT
  USING (
    status = 'cancelled'
    AND slug IS NOT NULL
    AND cancelled_at IS NOT NULL
    AND cancelled_at > now() - interval '30 days'
  );

-- 6. pg_cron: auto-delete archived surveys older than 30 days (daily at 3 AM UTC)
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'delete-archived-surveys',
  '0 3 * * *',
  $$DELETE FROM public.surveys WHERE status = 'archived' AND archived_at < now() - interval '30 days'$$
);

-- 7. pg_cron: auto-activate pending surveys past their starts_at (every 5 minutes)
SELECT cron.schedule(
  'activate-pending-surveys',
  '*/5 * * * *',
  $$UPDATE public.surveys SET status = 'active' WHERE status = 'pending' AND starts_at <= now()$$
);

-- 8. pg_cron: auto-close expired active surveys past their ends_at (every 5 minutes)
SELECT cron.schedule(
  'auto-close-expired-surveys',
  '*/5 * * * *',
  $$UPDATE public.surveys SET status = 'closed', closed_at = now() WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at <= now()$$
);
