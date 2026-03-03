-- =============================================================================
-- Audit fixes: survey status checks in respondent RPCs + project complete cascade
-- =============================================================================
-- 1. validate_and_save_answer: block saves to trashed surveys
-- 2. submit_survey_response: flag submissions to non-active surveys
-- 3. change_project_status_with_cascade: auto-complete active surveys on project complete
-- =============================================================================

-- ── 1. validate_and_save_answer: add survey status check ─────────────────────
-- Block answer saves only when the survey is trashed (about to be hard-deleted).
-- For other non-active statuses (completed, cancelled, archived) we allow saves
-- so respondents who started mid-flow can finish (graceful approach).

CREATE OR REPLACE FUNCTION "public"."validate_and_save_answer"(
  "p_response_id" "uuid",
  "p_question_id" "uuid",
  "p_value" "jsonb"
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
    v_question_type public.question_type;
    v_question_config jsonb;
    v_question_survey_id uuid;
    v_response_survey_id uuid;
    v_response_status text;
    v_survey_status text;
    v_rating int;
    v_text_value text;
    v_selected jsonb;
    v_max_length int;
    v_min_rating int;
    v_max_rating int;
    v_min_selections int;
    v_max_selections int;
BEGIN
    -- 1. Verify response exists and is in_progress
    SELECT survey_id, status
      INTO v_response_survey_id, v_response_status
      FROM public.survey_responses
     WHERE id = p_response_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_response_status != 'in_progress' THEN
        RAISE EXCEPTION 'RESPONSE_ALREADY_COMPLETED';
    END IF;

    -- 1b. Check parent survey status — block only if trashed
    SELECT status INTO v_survey_status
      FROM public.surveys
     WHERE id = v_response_survey_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SURVEY_NOT_FOUND';
    END IF;

    IF v_survey_status = 'trashed' THEN
        RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
    END IF;

    -- 2. Get question metadata
    SELECT type, config, survey_id
      INTO v_question_type, v_question_config, v_question_survey_id
      FROM public.survey_questions
     WHERE id = p_question_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND';
    END IF;

    -- 3. Cross-survey ownership check
    IF v_question_survey_id != v_response_survey_id THEN
        RAISE EXCEPTION 'QUESTION_SURVEY_MISMATCH';
    END IF;

    -- 4. Type-specific validation (with safe coercion)
    CASE v_question_type
        WHEN 'rating_scale' THEN
            BEGIN
                v_rating := (p_value->>'rating')::int;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'RATING_INVALID_FORMAT';
            END;

            IF v_rating IS NULL THEN
                RAISE EXCEPTION 'RATING_REQUIRED';
            END IF;

            BEGIN
                v_min_rating := COALESCE((v_question_config->>'min')::int, 1);
                v_max_rating := COALESCE((v_question_config->>'max')::int, 5);
            EXCEPTION WHEN OTHERS THEN
                v_min_rating := 1;
                v_max_rating := 5;
            END;

            IF v_rating < v_min_rating OR v_rating > v_max_rating THEN
                RAISE EXCEPTION 'RATING_OUT_OF_BOUNDS';
            END IF;

        WHEN 'multiple_choice' THEN
            v_selected := p_value->'selected';

            IF v_selected IS NULL OR jsonb_typeof(v_selected) != 'array' THEN
                RAISE EXCEPTION 'SELECTED_MUST_BE_ARRAY';
            END IF;

            BEGIN
                v_max_selections := (v_question_config->>'maxSelections')::int;
                v_min_selections := (v_question_config->>'minSelections')::int;
            EXCEPTION WHEN OTHERS THEN
                v_max_selections := NULL;
                v_min_selections := NULL;
            END;

            IF v_max_selections IS NOT NULL AND jsonb_array_length(v_selected) > v_max_selections THEN
                RAISE EXCEPTION 'MAX_SELECTIONS_EXCEEDED';
            END IF;

            IF v_min_selections IS NOT NULL AND jsonb_array_length(v_selected) < v_min_selections THEN
                RAISE EXCEPTION 'MIN_SELECTIONS_NOT_MET';
            END IF;

            IF NOT COALESCE((v_question_config->>'allowOther')::boolean, false) THEN
                IF EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements_text(v_selected) AS sel
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements_text(v_question_config->'options') AS opt
                        WHERE opt = sel
                    )
                ) THEN
                    RAISE EXCEPTION 'INVALID_OPTION_SELECTED';
                END IF;
            END IF;

        WHEN 'yes_no' THEN
            IF p_value->>'answer' IS NULL
               OR (p_value->>'answer' != 'true' AND p_value->>'answer' != 'false') THEN
                RAISE EXCEPTION 'YES_NO_INVALID';
            END IF;

        WHEN 'open_text', 'short_text' THEN
            v_text_value := p_value->>'text';

            IF v_text_value IS NOT NULL THEN
                BEGIN
                    v_max_length := (v_question_config->>'maxLength')::int;
                EXCEPTION WHEN OTHERS THEN
                    v_max_length := NULL;
                END;

                IF v_max_length IS NOT NULL AND char_length(v_text_value) > v_max_length THEN
                    RAISE EXCEPTION 'TEXT_TOO_LONG';
                END IF;
            END IF;
    END CASE;

    -- 5. Upsert the validated answer
    INSERT INTO public.survey_answers (response_id, question_id, value)
    VALUES (p_response_id, p_question_id, p_value)
    ON CONFLICT (response_id, question_id)
    DO UPDATE SET value = EXCLUDED.value,
                  updated_at = now();
END;
$$;


-- ── 2. submit_survey_response: check survey status, flag if non-active ───────
-- Extends the existing ends_at check to also cover status changes.
-- Respondents who started while survey was active can still submit,
-- but their response is flagged as submitted_after_close.

CREATE OR REPLACE FUNCTION "public"."submit_survey_response"(
  "p_response_id" "uuid",
  "p_contact_name" "text" DEFAULT NULL::"text",
  "p_contact_email" "text" DEFAULT NULL::"text",
  "p_feedback" "text" DEFAULT NULL::"text"
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
    v_survey_id uuid;
    v_status text;
    v_survey_status text;
    v_max integer;
    v_completed integer;
    v_ends_at timestamptz;
    v_is_late boolean := false;
BEGIN
    SELECT survey_id, status
      INTO v_survey_id, v_status
      FROM public.survey_responses
     WHERE id = p_response_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_status != 'in_progress' THEN
        RAISE EXCEPTION 'RESPONSE_ALREADY_COMPLETED';
    END IF;

    -- Check parent survey status — block if trashed, flag if non-active
    SELECT status, ends_at
      INTO v_survey_status, v_ends_at
      FROM public.surveys
     WHERE id = v_survey_id;

    IF NOT FOUND OR v_survey_status = 'trashed' THEN
        RAISE EXCEPTION 'SURVEY_NOT_FOUND';
    END IF;

    IF v_survey_status <> 'active' THEN
        v_is_late := true;
    END IF;

    -- Also flag if the survey's time window has passed
    IF v_ends_at IS NOT NULL AND v_ends_at < now() THEN
        v_is_late := true;
    END IF;

    UPDATE public.survey_responses
    SET status = 'completed',
        contact_name_encrypted = public.encrypt_pii(p_contact_name),
        contact_email_encrypted = public.encrypt_pii(p_contact_email),
        feedback = p_feedback,
        completed_at = now(),
        updated_at = now(),
        submitted_after_close = v_is_late
    WHERE id = p_response_id;

    -- Only count non-late responses toward max_respondents auto-complete.
    IF NOT v_is_late THEN
        SELECT max_respondents
          INTO v_max
          FROM public.surveys
         WHERE id = v_survey_id;

        IF v_max IS NOT NULL THEN
            SELECT count(*)
              INTO v_completed
              FROM public.survey_responses
             WHERE survey_id = v_survey_id
               AND status = 'completed'
               AND submitted_after_close = false;

            IF v_completed >= v_max THEN
                UPDATE public.surveys
                SET status = 'completed',
                    completed_at = now(),
                    updated_at = now()
                WHERE id = v_survey_id
                  AND status = 'active';
            END IF;
        END IF;
    END IF;
END;
$$;


-- ── 3. change_project_status_with_cascade: auto-complete on project complete ─
-- When a project is completed, auto-complete all active surveys under it.
-- This prevents the illogical state of active surveys under a completed project.

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
    WHEN 'complete' THEN
      -- Auto-complete active surveys under this project
      UPDATE surveys
         SET status = 'completed',
             completed_at = v_now,
             updated_at = v_now
       WHERE project_id = p_project_id
         AND status = 'active';

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
      -- reopen: no cascade
      NULL;
  END CASE;

  RETURN jsonb_build_object('success', true);
END;
$$;
