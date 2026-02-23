-- ============================================================
-- get_project_signals_data: return per-question answer data
-- for all active/completed surveys in a project.
-- Used by the auto-signals engine (TS) to compute strength /
-- threat / neutral signals from quantitative response data.
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."get_project_signals_data"(
    "p_project_id" "uuid",
    "p_user_id" "uuid"
) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Auth guard
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    -- Verify project ownership
    IF NOT EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p_project_id AND user_id = p_user_id
    ) THEN
        RETURN '[]'::jsonb;
    END IF;

    SELECT COALESCE(jsonb_agg(survey_row ORDER BY s_created_at DESC), '[]'::jsonb)
    INTO v_result
    FROM (
        SELECT
            jsonb_build_object(
                'surveyId',            s.id,
                'surveyTitle',         s.title,
                'researchPhase',       s.research_phase,
                'totalResponses',      (
                    SELECT count(*)
                    FROM public.survey_responses sr
                    WHERE sr.survey_id = s.id
                ),
                'completedResponses',  (
                    SELECT count(*)
                    FROM public.survey_responses sr
                    WHERE sr.survey_id = s.id AND sr.status = 'completed'
                ),
                'questions', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id',      q.id,
                            'text',    q.text,
                            'type',    q.type,
                            'config',  COALESCE(q.config, '{}'::jsonb),
                            'answers', COALESCE((
                                SELECT jsonb_agg(
                                    jsonb_build_object('value', a.value)
                                )
                                FROM public.survey_answers a
                                JOIN public.survey_responses r ON r.id = a.response_id
                                WHERE a.question_id = q.id
                                  AND r.status = 'completed'
                            ), '[]'::jsonb)
                        ) ORDER BY q.sort_order
                    )
                    FROM public.survey_questions q
                    WHERE q.survey_id = s.id
                ), '[]'::jsonb)
            ) AS survey_row,
            s.created_at AS s_created_at
        FROM public.surveys s
        WHERE s.project_id = p_project_id
          AND s.user_id = p_user_id
          AND s.status IN ('active', 'completed')
    ) sub;

    RETURN v_result;
END;
$$;

ALTER FUNCTION "public"."get_project_signals_data"("uuid", "uuid") OWNER TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_project_signals_data"("uuid", "uuid") TO "authenticated";
