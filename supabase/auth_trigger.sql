-- ============================================================
-- AUTH TRIGGER — must be applied MANUALLY on Supabase Cloud
-- ============================================================
--
-- Supabase Cloud does not allow `supabase db push` to create triggers on the
-- auth schema. This trigger must be created via the Supabase Dashboard:
--   Dashboard → SQL Editor → New Query → paste this file → Run
--
-- The trigger calls public.handle_new_user() (defined in the migration) to
-- insert a row into public.profiles whenever a new user signs up.
--
-- Without this trigger new users will NOT have a profile row. The app has a
-- fallback (auth callback upserts a profile if missing), but the trigger is
-- the primary mechanism and should always be present.
--
-- WHEN TO RE-RUN:
--   • After creating a new Supabase project
--   • After restoring a backup
--   • After running `supabase migration squash` + `db push` (squash may
--     revert the trigger if it was previously recorded in a migration)
-- ============================================================

CREATE OR REPLACE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."handle_new_user"();
