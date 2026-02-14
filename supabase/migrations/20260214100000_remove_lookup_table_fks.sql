-- Drop FK constraints from profiles.role and surveys.category.
-- Validation is now handled by app-layer Zod schemas using config values
-- from src/features/settings/config/roles.ts and src/features/surveys/config/survey-categories.ts.
-- The lookup tables themselves remain in the DB for now (to be cleaned up in a future batch).

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_fk;
ALTER TABLE public.surveys DROP CONSTRAINT IF EXISTS surveys_category_fk;
