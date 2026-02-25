-- =============================================================================
-- Migration: add_research_phases
-- Description: Re-introduce simplified research phases (idea, research,
--              validation, decision) as nullable text columns with CHECK
--              constraints on surveys and project_insights. Update RPC
--              functions to include the new researchPhase field.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD columns and constraints
-- -----------------------------------------------------------------------------

-- surveys.research_phase
ALTER TABLE "public"."surveys"
  ADD COLUMN "research_phase" text;

ALTER TABLE "public"."surveys"
  ADD CONSTRAINT "surveys_research_phase_check"
  CHECK (research_phase IS NULL OR research_phase IN ('idea', 'research', 'validation', 'decision'));

-- project_insights.phase
ALTER TABLE "public"."project_insights"
  ADD COLUMN "phase" text;

ALTER TABLE "public"."project_insights"
  ADD CONSTRAINT "project_insights_phase_check"
  CHECK (phase IS NULL OR phase IN ('idea', 'research', 'validation', 'decision'));

-- -----------------------------------------------------------------------------
-- 2. Update get_user_surveys_with_counts — add researchPhase
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."get_user_surveys_with_counts"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'title', s.title,
                'description', s.description,
                'status', s.status,
                'slug', s.slug,
                'viewCount', s.view_count,
                'responseCount', COALESCE(rc.cnt, 0),
                'completedCount', COALESCE(cc.cnt, 0),
                'questionCount', COALESCE(qc.cnt, 0),
                'recentActivity', COALESCE(ra.daily, '[]'::jsonb),
                'lastResponseAt', lr.last_at,
                'startsAt', s.starts_at,
                'endsAt', s.ends_at,
                'maxRespondents', s.max_respondents,
                'archivedAt', s.archived_at,
                'cancelledAt', s.cancelled_at,
                'completedAt', s.completed_at,
                'createdAt', s.created_at,
                'updatedAt', s.updated_at,
                'avgCompletionSeconds', ct.avg_secs,
                'avgQuestionCompletion', aqc.avg_pct,
                'projectId', s.project_id,
                'projectName', p.name,
                'researchPhase', s.research_phase
            ) ORDER BY s.updated_at DESC
        )
        FROM public.surveys s

        LEFT JOIN public.projects p ON p.id = s.project_id

        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            GROUP BY survey_id
        ) rc ON rc.survey_id = s.id

        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            WHERE status = 'completed'
            GROUP BY survey_id
        ) cc ON cc.survey_id = s.id

        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_questions
            GROUP BY survey_id
        ) qc ON qc.survey_id = s.id

        LEFT JOIN (
            SELECT survey_id, max(completed_at) AS last_at
            FROM public.survey_responses
            WHERE status = 'completed'
              AND completed_at IS NOT NULL
            GROUP BY survey_id
        ) lr ON lr.survey_id = s.id

        LEFT JOIN LATERAL (
            SELECT jsonb_agg(day_count ORDER BY day) AS daily
            FROM (
                SELECT d.day, COALESCE(cnt.c, 0) AS day_count
                FROM generate_series(
                    (current_date - interval '13 days')::date,
                    current_date,
                    interval '1 day'
                ) AS d(day)
                LEFT JOIN (
                    SELECT created_at::date AS rday, count(*) AS c
                    FROM public.survey_responses
                    WHERE survey_id = s.id AND status = 'completed'
                      AND created_at >= (current_date - interval '13 days')
                    GROUP BY created_at::date
                ) cnt ON cnt.rday = d.day
            ) sub
        ) ra ON true

        LEFT JOIN (
            SELECT survey_id,
                   round(avg(extract(epoch FROM (completed_at - started_at))))::int AS avg_secs
            FROM public.survey_responses
            WHERE status = 'completed'
              AND completed_at IS NOT NULL
              AND started_at IS NOT NULL
            GROUP BY survey_id
        ) ct ON ct.survey_id = s.id

        LEFT JOIN LATERAL (
            SELECT count(*) AS total_answers
            FROM public.survey_answers a
            JOIN public.survey_responses r ON r.id = a.response_id
            WHERE r.survey_id = s.id
              AND r.status = 'completed'
        ) ac ON true

        LEFT JOIN LATERAL (
            SELECT CASE
                       WHEN COALESCE(cc.cnt, 0) = 0 OR COALESCE(qc.cnt, 0) = 0 THEN NULL
                       ELSE round(
                           COALESCE(ac.total_answers, 0)::numeric
                           / (COALESCE(cc.cnt, 0) * COALESCE(qc.cnt, 0))
                           * 100
                       )::int
                   END AS avg_pct
        ) aqc ON true

        WHERE s.user_id = p_user_id
    ), '[]'::jsonb);
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Update get_project_signals_data — add researchPhase
-- -----------------------------------------------------------------------------

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
