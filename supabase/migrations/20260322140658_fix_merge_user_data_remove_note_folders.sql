CREATE OR REPLACE FUNCTION "public"."merge_user_data"("from_user_id" "uuid", "to_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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

  -- 4. Merge profile data: fill empty target fields from source
  UPDATE public.profiles AS target
  SET
    avatar_url  = CASE WHEN target.avatar_url = '' THEN source.avatar_url ELSE target.avatar_url END,
    bio         = CASE WHEN target.bio = ''         THEN source.bio         ELSE target.bio END,
    full_name   = CASE WHEN target.full_name = ''   THEN source.full_name   ELSE target.full_name END,
    role        = CASE WHEN target.role IS NULL      THEN source.role        ELSE target.role END
  FROM public.profiles AS source
  WHERE target.id = to_user_id AND source.id = from_user_id;

  -- 5. Delete source profile
  DELETE FROM public.profiles WHERE id = from_user_id;
END;
$$;
