-- Allow reusing project names when the original is trashed.
-- 1. Replace the full unique index with a partial one (excludes trashed).
-- 2. Add name conflict check on restoreTrash (appends " (restored)" if needed).

-- Replace the unique index to exclude trashed projects
DROP INDEX IF EXISTS public.projects_user_id_name_unique;
CREATE UNIQUE INDEX projects_user_id_name_unique
  ON public.projects (user_id, lower(name))
  WHERE status != 'trashed';

-- Updated RPC with name conflict check on restoreTrash
CREATE OR REPLACE FUNCTION public.change_project_status_with_cascade(
  p_project_id uuid,
  p_user_id uuid,
  p_action text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_project RECORD;
  v_now TIMESTAMPTZ := now();
  v_new_status TEXT;
  v_project_name TEXT;
  v_base_name TEXT;
  v_suffix INT;
BEGIN
  -- 1. Fetch and lock the project
  SELECT status, pre_trash_status, pre_archive_status, name
    INTO v_project
    FROM public.projects
   WHERE id = p_project_id
     AND user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'projects.errors.unexpected');
  END IF;

  -- 2. Validate transition
  CASE p_action
    WHEN 'complete' THEN
      IF v_project.status != 'active' THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    WHEN 'archive' THEN
      IF v_project.status NOT IN ('active', 'completed') THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    WHEN 'reopen' THEN
      IF v_project.status != 'completed' THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    WHEN 'restore' THEN
      IF v_project.status != 'archived' THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    WHEN 'trash' THEN
      IF v_project.status NOT IN ('active', 'completed', 'archived') THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    WHEN 'restoreTrash' THEN
      IF v_project.status != 'trashed' THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    ELSE
      RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
  END CASE;

  -- 3. Update the project
  CASE p_action
    WHEN 'complete' THEN
      UPDATE public.projects
         SET status = 'completed', completed_at = v_now
       WHERE id = p_project_id;

    WHEN 'archive' THEN
      UPDATE public.projects
         SET status = 'archived', archived_at = v_now, pre_archive_status = v_project.status
       WHERE id = p_project_id;

    WHEN 'reopen' THEN
      UPDATE public.projects
         SET status = 'active', completed_at = NULL
       WHERE id = p_project_id;

    WHEN 'restore' THEN
      v_new_status := COALESCE(v_project.pre_archive_status, 'active');
      UPDATE public.projects
         SET status = v_new_status, archived_at = NULL, pre_archive_status = NULL
       WHERE id = p_project_id;

    WHEN 'trash' THEN
      UPDATE public.projects
         SET status = 'trashed', deleted_at = v_now, pre_trash_status = v_project.status
       WHERE id = p_project_id;

    WHEN 'restoreTrash' THEN
      v_new_status := COALESCE(v_project.pre_trash_status, 'active');

      -- Strip any existing "(restored #N)" suffix before generating a new one
      v_base_name := regexp_replace(v_project.name, '\s*\(restored #\d+\)$', '');
      v_suffix := 1;
      v_project_name := v_base_name || ' (restored #1)';

      WHILE EXISTS(
        SELECT 1 FROM public.projects
         WHERE user_id = p_user_id
           AND id != p_project_id
           AND lower(name) = lower(v_project_name)
           AND status != 'trashed'
      ) LOOP
        v_suffix := v_suffix + 1;
        v_project_name := v_base_name || ' (restored #' || v_suffix || ')';
      END LOOP;

      UPDATE public.projects
         SET status = v_new_status,
             deleted_at = NULL,
             pre_trash_status = NULL,
             name = v_project_name
       WHERE id = p_project_id;
  END CASE;

  -- 4. Cascade to surveys
  CASE p_action
    WHEN 'complete' THEN
      UPDATE public.surveys
         SET status = 'completed',
             completed_at = v_now,
             updated_at = v_now
       WHERE project_id = p_project_id
         AND status = 'active';

    WHEN 'trash' THEN
      UPDATE public.surveys
         SET pre_trash_status = status,
             status = 'trashed',
             deleted_at = v_now
       WHERE project_id = p_project_id
         AND status != 'trashed';

    WHEN 'restoreTrash' THEN
      UPDATE public.surveys
         SET status = COALESCE(pre_trash_status, 'draft')::public.survey_status,
             deleted_at = NULL,
             pre_trash_status = NULL
       WHERE project_id = p_project_id
         AND status = 'trashed';

    WHEN 'archive' THEN
      UPDATE public.surveys
         SET previous_status = status,
             status = 'archived',
             archived_at = v_now
       WHERE project_id = p_project_id
         AND status IN ('active', 'draft');

    WHEN 'restore' THEN
      UPDATE public.surveys
         SET status = COALESCE(previous_status, 'draft'),
             archived_at = NULL,
             previous_status = NULL
       WHERE project_id = p_project_id
         AND status = 'archived'
         AND previous_status IS NOT NULL;

    ELSE
      NULL;
  END CASE;

  RETURN jsonb_build_object('success', true);
END;
$$;
