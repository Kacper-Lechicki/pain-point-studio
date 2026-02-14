-- Drop vestigial lookup tables whose data moved to app-level config.
-- FK constraints were removed in 20260214100000_remove_lookup_table_fks.sql.
-- Validation is handled by Zod schemas using:
--   src/features/settings/config/roles.ts
--   src/features/settings/config/social-link-types.ts
--   src/features/surveys/config/survey-categories.ts

DROP POLICY IF EXISTS "Allow read access to roles" ON public.roles;
DROP POLICY IF EXISTS "Allow read access to social_link_types" ON public.social_link_types;
DROP POLICY IF EXISTS "Allow read access to survey_categories" ON public.survey_categories;

DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.social_link_types;
DROP TABLE IF EXISTS public.survey_categories;
