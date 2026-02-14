-- Survey Status Flow (part 1): add new enum values
-- These must commit before being used in policies/queries.
--
-- New statuses:
--   pending   — published with future start date, link active (countdown)
--   cancelled — withdrawn by author from pending or active

ALTER TYPE public.survey_status ADD VALUE IF NOT EXISTS 'pending' AFTER 'draft';
ALTER TYPE public.survey_status ADD VALUE IF NOT EXISTS 'cancelled' AFTER 'closed';
