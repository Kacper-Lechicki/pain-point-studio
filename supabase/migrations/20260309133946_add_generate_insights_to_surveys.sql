-- Add generate_insights column to surveys table.
-- Three-state semantics:
--   NULL  = user hasn't decided yet (pending prompt in insights tab)
--   true  = user opted in  — survey contributes to project suggestions
--   false = user opted out — survey excluded from suggestions
ALTER TABLE public.surveys
ADD COLUMN generate_insights boolean DEFAULT NULL;
