-- ============================================================
-- CRON JOBS — must be applied MANUALLY on Supabase Cloud
-- ============================================================
--
-- Supabase Cloud does not allow `supabase db push` to manage pg_cron jobs.
-- These must be created via the Supabase Dashboard:
--   Dashboard → SQL Editor → New Query → paste this file → Run
--
-- The jobs call maintenance functions defined in the migration to handle:
--   1. Abandoned response cleanup (mark stale in_progress → abandoned)
--   2. Auto-complete surveys past their end date
--
-- WHEN TO RE-RUN:
--   • After creating a new Supabase project
--   • After restoring a backup
--   • If cron jobs were accidentally deleted
--
-- To verify jobs are running:
--   SELECT * FROM cron.job;
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
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
