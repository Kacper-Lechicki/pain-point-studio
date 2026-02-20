-- Harden SECURITY DEFINER functions and add missing index.
--
-- Fixes:
-- 1. search_path: 5 respondent-facing functions had search_path = 'public'
--    instead of '' (empty). With 'public' in the path, a malicious object in
--    the public schema could shadow built-in functions. Changed to '' with
--    fully-qualified references (public.table, public.func).
-- 2. Dead overload: start_survey_response(uuid) was superseded by the
--    2-param version start_survey_response(uuid, text DEFAULT NULL).
--    The 1-param variant is unreachable — drop it.
-- 3. Missing index: survey_answers.response_id had no index despite being
--    the primary join column in RLS policies, get_survey_stats_data,
--    get_export_responses, and get_user_surveys_with_counts.

-- ============================================================
-- 1. Fix search_path on respondent-facing functions
-- ============================================================

-- record_survey_view: search_path 'public' → ''
CREATE OR REPLACE FUNCTION "public"."record_survey_view"("p_survey_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE public.surveys
     SET view_count = view_count + 1
   WHERE id = p_survey_id
     AND status = 'active';
END;
$$;

-- start_survey_response: search_path 'public' → ''
CREATE OR REPLACE FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_max integer;
  v_current integer;
  v_status text;
  v_response_id uuid;
BEGIN
  SELECT status, max_respondents
    INTO v_status, v_max
    FROM public.surveys
   WHERE id = p_survey_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SURVEY_NOT_FOUND';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
  END IF;

  IF v_max IS NOT NULL THEN
    SELECT count(*)
      INTO v_current
      FROM public.survey_responses
     WHERE survey_id = p_survey_id
       AND (
         status = 'completed'
         OR (status = 'in_progress' AND started_at > now() - interval '24 hours')
       );

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'MAX_RESPONDENTS_REACHED';
    END IF;
  END IF;

  INSERT INTO public.survey_responses (survey_id, device_type)
  VALUES (p_survey_id, p_device_type)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;

-- submit_survey_response: search_path 'public' → ''
CREATE OR REPLACE FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text" DEFAULT NULL::"text", "p_contact_email" "text" DEFAULT NULL::"text", "p_feedback" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_survey_id uuid;
    v_status text;
    v_max integer;
    v_completed integer;
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

    UPDATE public.survey_responses
    SET status = 'completed',
        contact_name_encrypted = public.encrypt_pii(p_contact_name),
        contact_email_encrypted = public.encrypt_pii(p_contact_email),
        feedback = p_feedback,
        completed_at = now(),
        updated_at = now()
    WHERE id = p_response_id;

    SELECT max_respondents
      INTO v_max
      FROM public.surveys
     WHERE id = v_survey_id;

    IF v_max IS NOT NULL THEN
        SELECT count(*)
          INTO v_completed
          FROM public.survey_responses
         WHERE survey_id = v_survey_id
           AND status = 'completed';

        IF v_completed >= v_max THEN
            UPDATE public.surveys
            SET status = 'completed',
                completed_at = now(),
                updated_at = now()
            WHERE id = v_survey_id
              AND status = 'active';
        END IF;
    END IF;
END;
$$;

-- validate_and_save_answer: search_path 'public' → ''
CREATE OR REPLACE FUNCTION "public"."validate_and_save_answer"("p_response_id" "uuid", "p_question_id" "uuid", "p_value" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_question_type public.question_type;
    v_question_config jsonb;
    v_question_survey_id uuid;
    v_response_survey_id uuid;
    v_response_status text;
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

-- ============================================================
-- 2. Drop dead 1-param overload of start_survey_response
-- ============================================================
-- The 2-param version (uuid, text DEFAULT NULL) handles all calls.
-- The 1-param version is unreachable dead code.
DROP FUNCTION IF EXISTS "public"."start_survey_response"("uuid");

-- ============================================================
-- 3. Add missing index on survey_answers.response_id
-- ============================================================
-- Used in RLS policies, get_survey_stats_data, get_export_responses,
-- get_user_surveys_with_counts — without this, every answer lookup
-- does a sequential scan on survey_answers.
CREATE INDEX IF NOT EXISTS "survey_answers_response_id_idx"
  ON "public"."survey_answers" USING "btree" ("response_id");
