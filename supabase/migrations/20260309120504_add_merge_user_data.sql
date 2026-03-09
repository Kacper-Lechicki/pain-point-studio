-- Migration: Add functions for automatic identity linking (account merging)
--
-- When a user signs up with email and later signs in with an OAuth provider
-- (same email), Supabase may create a separate account instead of linking.
-- These functions provide application-level detection and merging.

-- ============================================================
-- 1. find_user_by_email_excluding(email, exclude_id)
--    Looks up an auth.users row by email, excluding a specific user.
--    Used by the auth callback to detect duplicate accounts.
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_user_by_email_excluding(
  lookup_email text,
  exclude_id uuid
) RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT id FROM auth.users
  WHERE email = lookup_email AND id != exclude_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_user_by_email_excluding(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_user_by_email_excluding(text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.find_user_by_email_excluding(text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_by_email_excluding(text, uuid) TO service_role;


-- ============================================================
-- 2. merge_user_data(from_user_id, to_user_id)
--    Transfers all user-owned data from source to target user.
--    Called by the auth callback when a duplicate account is detected.
--
--    Tables with direct user_id FK to auth.users:
--      - projects          (unique index on user_id + lower(name))
--      - surveys           (user_id)
--      - project_notes     (user_id)
--      - project_note_folders (user_id)
--      - profiles          (id = user_id, PK)
--
--    Indirect tables (cascade through parent FKs, no direct update needed):
--      - project_insights  → projects.id
--      - survey_questions  → surveys.id
--      - survey_responses  → surveys.id
--      - survey_answers    → survey_responses.id
-- ============================================================
CREATE OR REPLACE FUNCTION public.merge_user_data(
  from_user_id uuid,
  to_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validate inputs
  IF from_user_id = to_user_id THEN
    RAISE EXCEPTION 'Cannot merge a user into themselves';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = from_user_id) THEN
    RAISE EXCEPTION 'Source user % does not exist', from_user_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = to_user_id) THEN
    RAISE EXCEPTION 'Target user % does not exist', to_user_id;
  END IF;

  -- 1. Projects: handle unique constraint on (user_id, lower(name))
  --    Rename conflicting source projects before reassigning.
  UPDATE public.projects
  SET name = name || ' (merged)'
  WHERE user_id = from_user_id
    AND lower(name) IN (
      SELECT lower(p2.name) FROM public.projects p2 WHERE p2.user_id = to_user_id
    );

  UPDATE public.projects
  SET user_id = to_user_id
  WHERE user_id = from_user_id;

  -- 2. Surveys
  UPDATE public.surveys
  SET user_id = to_user_id
  WHERE user_id = from_user_id;

  -- 3. Project notes
  UPDATE public.project_notes
  SET user_id = to_user_id
  WHERE user_id = from_user_id;

  -- 4. Project note folders
  UPDATE public.project_note_folders
  SET user_id = to_user_id
  WHERE user_id = from_user_id;

  -- 5. Merge profile data: fill empty target fields from source
  UPDATE public.profiles AS target
  SET
    avatar_url  = CASE WHEN target.avatar_url = '' THEN source.avatar_url ELSE target.avatar_url END,
    bio         = CASE WHEN target.bio = ''         THEN source.bio         ELSE target.bio END,
    full_name   = CASE WHEN target.full_name = ''   THEN source.full_name   ELSE target.full_name END,
    role        = CASE WHEN target.role IS NULL      THEN source.role        ELSE target.role END
  FROM public.profiles AS source
  WHERE target.id = to_user_id AND source.id = from_user_id;

  -- 6. Delete source profile (will also cascade when auth.users row is deleted,
  --    but we do it explicitly so the caller can safely delete the auth user next).
  DELETE FROM public.profiles WHERE id = from_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.merge_user_data(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_user_data(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.merge_user_data(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.merge_user_data(uuid, uuid) TO service_role;
