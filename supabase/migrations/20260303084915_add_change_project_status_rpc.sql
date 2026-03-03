-- ============================================================
-- RPC: change_project_status_with_cascade
-- Atomically updates a project's status and cascades to surveys.
-- ============================================================

CREATE OR REPLACE FUNCTION public.change_project_status_with_cascade(
  p_project_id UUID,
  p_user_id UUID,
  p_action TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project RECORD;
  v_now TIMESTAMPTZ := now();
  v_new_status TEXT;
BEGIN
  -- ── 1. Fetch and lock the project ─────────────────────────────────
  SELECT status, pre_trash_status, pre_archive_status
    INTO v_project
    FROM projects
   WHERE id = p_project_id
     AND user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'projects.errors.unexpected');
  END IF;

  -- ── 2. Validate transition ────────────────────────────────────────
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

  -- ── 3. Update the project ─────────────────────────────────────────
  CASE p_action
    WHEN 'complete' THEN
      UPDATE projects
         SET status = 'completed', completed_at = v_now
       WHERE id = p_project_id;

    WHEN 'archive' THEN
      UPDATE projects
         SET status = 'archived', archived_at = v_now, pre_archive_status = v_project.status
       WHERE id = p_project_id;

    WHEN 'reopen' THEN
      UPDATE projects
         SET status = 'active', completed_at = NULL
       WHERE id = p_project_id;

    WHEN 'restore' THEN
      v_new_status := COALESCE(v_project.pre_archive_status, 'active');
      UPDATE projects
         SET status = v_new_status, archived_at = NULL, pre_archive_status = NULL
       WHERE id = p_project_id;

    WHEN 'trash' THEN
      UPDATE projects
         SET status = 'trashed', deleted_at = v_now, pre_trash_status = v_project.status
       WHERE id = p_project_id;

    WHEN 'restoreTrash' THEN
      v_new_status := COALESCE(v_project.pre_trash_status, 'active');
      UPDATE projects
         SET status = v_new_status, deleted_at = NULL, pre_trash_status = NULL
       WHERE id = p_project_id;
  END CASE;

  -- ── 4. Cascade to surveys ─────────────────────────────────────────
  CASE p_action
    WHEN 'trash' THEN
      -- Trash all non-trashed surveys, saving each one's current status
      UPDATE surveys
         SET pre_trash_status = status,
             status = 'trashed',
             deleted_at = v_now
       WHERE project_id = p_project_id
         AND status != 'trashed';

    WHEN 'restoreTrash' THEN
      -- Restore trashed surveys to their pre_trash_status
      UPDATE surveys
         SET status = COALESCE(pre_trash_status, 'draft'),
             deleted_at = NULL,
             pre_trash_status = NULL
       WHERE project_id = p_project_id
         AND status = 'trashed';

    WHEN 'archive' THEN
      -- Archive active and draft surveys (save previous_status for restore)
      UPDATE surveys
         SET previous_status = status,
             status = 'archived',
             archived_at = v_now
       WHERE project_id = p_project_id
         AND status IN ('active', 'draft');

    WHEN 'restore' THEN
      -- Restore only cascade-archived surveys (those with previous_status set)
      UPDATE surveys
         SET status = COALESCE(previous_status, 'draft'),
             archived_at = NULL,
             previous_status = NULL
       WHERE project_id = p_project_id
         AND status = 'archived'
         AND previous_status IS NOT NULL;

    ELSE
      -- complete, reopen: no cascade
      NULL;
  END CASE;

  RETURN jsonb_build_object('success', true);
END;
$$;
