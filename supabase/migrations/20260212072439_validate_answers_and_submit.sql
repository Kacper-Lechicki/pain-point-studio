-- =============================================================================
-- 1. Validate and save answer
--    Enforces type-specific constraints and cross-survey ownership.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_and_save_answer(
    p_response_id uuid,
    p_question_id uuid,
    p_value jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_question_type question_type;
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
      FROM survey_responses
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
      FROM survey_questions
     WHERE id = p_question_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND';
    END IF;

    -- 3. Cross-survey ownership check
    IF v_question_survey_id != v_response_survey_id THEN
        RAISE EXCEPTION 'QUESTION_SURVEY_MISMATCH';
    END IF;

    -- 4. Type-specific validation
    CASE v_question_type
        WHEN 'rating_scale' THEN
            v_rating := (p_value->>'rating')::int;

            IF v_rating IS NULL THEN
                RAISE EXCEPTION 'RATING_REQUIRED';
            END IF;

            v_min_rating := COALESCE((v_question_config->>'min')::int, 1);
            v_max_rating := COALESCE((v_question_config->>'max')::int, 5);

            IF v_rating < v_min_rating OR v_rating > v_max_rating THEN
                RAISE EXCEPTION 'RATING_OUT_OF_BOUNDS';
            END IF;

        WHEN 'multiple_choice' THEN
            v_selected := p_value->'selected';

            IF v_selected IS NULL OR jsonb_typeof(v_selected) != 'array' THEN
                RAISE EXCEPTION 'SELECTED_MUST_BE_ARRAY';
            END IF;

            v_max_selections := (v_question_config->>'maxSelections')::int;
            v_min_selections := (v_question_config->>'minSelections')::int;

            IF v_max_selections IS NOT NULL AND jsonb_array_length(v_selected) > v_max_selections THEN
                RAISE EXCEPTION 'MAX_SELECTIONS_EXCEEDED';
            END IF;

            IF v_min_selections IS NOT NULL AND jsonb_array_length(v_selected) < v_min_selections THEN
                RAISE EXCEPTION 'MIN_SELECTIONS_NOT_MET';
            END IF;

            -- Validate each option exists in config (unless allowOther is true)
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
                v_max_length := (v_question_config->>'maxLength')::int;

                IF v_max_length IS NOT NULL AND char_length(v_text_value) > v_max_length THEN
                    RAISE EXCEPTION 'TEXT_TOO_LONG';
                END IF;
            END IF;
    END CASE;

    -- 5. Upsert the validated answer
    INSERT INTO survey_answers (response_id, question_id, value)
    VALUES (p_response_id, p_question_id, p_value)
    ON CONFLICT (response_id, question_id)
    DO UPDATE SET value = EXCLUDED.value,
                  updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_and_save_answer(uuid, uuid, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_and_save_answer(uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_and_save_answer(uuid, uuid, jsonb) TO service_role;


-- =============================================================================
-- 2. Submit response with required-field validation
--    Prevents marking a response as completed when required questions are
--    unanswered.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.submit_survey_response(
    p_response_id uuid,
    p_contact_name text DEFAULT NULL,
    p_contact_email text DEFAULT NULL,
    p_feedback text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_survey_id uuid;
    v_status text;
    v_missing_count int;
BEGIN
    -- 1. Verify response exists and is in_progress
    SELECT survey_id, status
      INTO v_survey_id, v_status
      FROM survey_responses
     WHERE id = p_response_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_status != 'in_progress' THEN
        RAISE EXCEPTION 'RESPONSE_ALREADY_COMPLETED';
    END IF;

    -- 2. Check all required questions have non-empty answers
    SELECT COUNT(*)
      INTO v_missing_count
      FROM survey_questions q
     WHERE q.survey_id = v_survey_id
       AND q.required = true
       AND NOT EXISTS (
           SELECT 1
           FROM survey_answers a
           WHERE a.response_id = p_response_id
             AND a.question_id = q.id
             AND a.value IS NOT NULL
             AND a.value != '{}'::jsonb
       );

    IF v_missing_count > 0 THEN
        RAISE EXCEPTION 'REQUIRED_QUESTIONS_UNANSWERED';
    END IF;

    -- 3. Mark as completed
    UPDATE survey_responses
    SET status = 'completed',
        contact_name = p_contact_name,
        contact_email = p_contact_email,
        feedback = p_feedback,
        completed_at = now(),
        updated_at = now()
    WHERE id = p_response_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_survey_response(uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_survey_response(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_survey_response(uuid, text, text, text) TO service_role;


-- =============================================================================
-- 3. Fix stats consistency: totalResponses should only count completed
--    Previously it counted ALL responses (including in_progress), while
--    answer data only included completed ones — misleading mismatch.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_survey_stats_data(
    p_survey_id uuid,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'survey', jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'slug', s.slug,
            'status', s.status,
            'startsAt', s.starts_at,
            'endsAt', s.ends_at,
            'maxRespondents', s.max_respondents
        ),
        'totalResponses', (
            SELECT count(*) FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'completed'
        ),
        'completedResponses', (
            SELECT count(*) FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'completed'
        ),
        'inProgressResponses', (
            SELECT count(*) FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'in_progress'
        ),
        'questions', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', q.id,
                    'text', q.text,
                    'type', q.type,
                    'sortOrder', q.sort_order,
                    'answers', COALESCE((
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'value', a.value,
                                'completedAt', r.completed_at
                            )
                        )
                        FROM public.survey_answers a
                        JOIN public.survey_responses r ON r.id = a.response_id
                        WHERE a.question_id = q.id AND r.status = 'completed'
                    ), '[]'::jsonb)
                ) ORDER BY q.sort_order
            )
            FROM public.survey_questions q
            WHERE q.survey_id = p_survey_id
        ), '[]'::jsonb)
    )
    INTO v_result
    FROM public.surveys s
    WHERE s.id = p_survey_id AND s.user_id = p_user_id;

    RETURN v_result;
END;
$$;
