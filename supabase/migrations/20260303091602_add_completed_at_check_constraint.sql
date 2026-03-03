-- Enforce data integrity: completed responses must have completed_at set.
-- This prevents export/analytics from showing NULL timestamps for finished responses.

ALTER TABLE public.survey_responses
  ADD CONSTRAINT chk_completed_has_timestamp
  CHECK (status != 'completed' OR completed_at IS NOT NULL);
