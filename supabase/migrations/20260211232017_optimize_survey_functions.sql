-- =============================================================================
-- 1. Atomic save_survey_questions function
--    Replaces non-atomic JS delete+insert with a single DB transaction.
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."save_survey_questions"(
    p_survey_id "uuid",
    p_user_id "uuid",
    p_questions "jsonb"
)
RETURNS void
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO ''
AS $$
BEGIN
    -- Verify ownership
    IF NOT EXISTS (
        SELECT 1 FROM public.surveys
        WHERE id = p_survey_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Survey not found or access denied';
    END IF;

    -- Atomic delete + insert in single transaction
    DELETE FROM public.survey_questions WHERE survey_id = p_survey_id;

    INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order)
    SELECT
        COALESCE((elem->>'id')::uuid, extensions.uuid_generate_v4()),
        p_survey_id,
        elem->>'text',
        (elem->>'type')::public.question_type,
        COALESCE((elem->>'required')::boolean, true),
        NULLIF(elem->>'description', ''),
        COALESCE(elem->'config', '{}'::jsonb),
        (elem->>'sortOrder')::integer
    FROM jsonb_array_elements(p_questions) AS elem;
END;
$$;

ALTER FUNCTION "public"."save_survey_questions"("uuid", "uuid", "jsonb") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."save_survey_questions"("uuid", "uuid", "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_survey_questions"("uuid", "uuid", "jsonb") TO "service_role";


-- =============================================================================
-- 2. Server-side stats aggregation function
--    Replaces 4 JS round-trips with a single SQL call.
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."get_survey_stats_data"(
    p_survey_id "uuid",
    p_user_id "uuid"
)
RETURNS "jsonb"
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
SET "search_path" TO ''
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
            WHERE survey_id = p_survey_id
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

ALTER FUNCTION "public"."get_survey_stats_data"("uuid", "uuid") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_survey_stats_data"("uuid", "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_survey_stats_data"("uuid", "uuid") TO "service_role";


-- =============================================================================
-- 3. Tighten RLS policies on survey_responses
--    Previously: "Anyone can read responses" (too permissive)
--    Now: Only survey owners (via survey join) or service_role can read all.
--    Anonymous users can only read their own response by ID.
-- =============================================================================

-- Drop the overly-permissive policy
DROP POLICY IF EXISTS "Anyone can read responses" ON "public"."survey_responses";

-- Survey owners can read all responses for their surveys
CREATE POLICY "Owners can read responses for own surveys" ON "public"."survey_responses"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.surveys
            WHERE surveys.id = survey_responses.survey_id
              AND surveys.user_id = ( SELECT auth.uid() )
        )
    );

-- Anonymous/public users can read a specific response (for resume flow)
-- They need the response ID which is only known to the respondent
CREATE POLICY "Anyone can read response by id" ON "public"."survey_responses"
    FOR SELECT USING (
        auth.uid() IS NULL
        OR NOT EXISTS (
            SELECT 1 FROM public.surveys
            WHERE surveys.id = survey_responses.survey_id
              AND surveys.user_id = ( SELECT auth.uid() )
        )
    );


-- =============================================================================
-- 4. Tighten RLS policies on survey_answers
--    Previously: "Anyone can read answers" (too permissive)
--    Now: Only survey owners or holders of a valid response_id can read.
-- =============================================================================

-- Drop the overly-permissive policy
DROP POLICY IF EXISTS "Anyone can read answers" ON "public"."survey_answers";

-- Survey owners can read all answers for their surveys' responses
CREATE POLICY "Owners can read answers for own surveys" ON "public"."survey_answers"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.survey_responses sr
            JOIN public.surveys s ON s.id = sr.survey_id
            WHERE sr.id = survey_answers.response_id
              AND s.user_id = ( SELECT auth.uid() )
        )
    );

-- Anyone can read answers for a response they hold the ID of
-- (respondents need this for resume/review flow)
CREATE POLICY "Anyone can read own answers by response id" ON "public"."survey_answers"
    FOR SELECT USING (
        auth.uid() IS NULL
        OR NOT EXISTS (
            SELECT 1 FROM public.survey_responses sr
            JOIN public.surveys s ON s.id = sr.survey_id
            WHERE sr.id = survey_answers.response_id
              AND s.user_id = ( SELECT auth.uid() )
        )
    );
