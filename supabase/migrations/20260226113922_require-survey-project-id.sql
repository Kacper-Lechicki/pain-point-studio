-- =============================================================================
-- Migration: require-survey-project-id
-- Description: Make surveys.project_id NOT NULL. Every survey must belong to a
--              project. Orphan surveys (project_id IS NULL) are assigned to a
--              per-user "General" fallback project. Also adds a new RPC
--              get_project_surveys_with_counts for fetching surveys scoped to a
--              single project.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Handle orphan surveys — create fallback "General" project per user
-- -----------------------------------------------------------------------------

INSERT INTO public.projects (id, user_id, name, status)
SELECT gen_random_uuid(), s.user_id, 'General', 'active'
FROM public.surveys s
WHERE s.project_id IS NULL
GROUP BY s.user_id;

-- Assign orphan surveys to their user's General project
UPDATE public.surveys s
SET project_id = p.id
FROM public.projects p
WHERE s.project_id IS NULL
  AND p.user_id = s.user_id
  AND p.name = 'General';

-- -----------------------------------------------------------------------------
-- 2. Add NOT NULL constraint
-- -----------------------------------------------------------------------------

ALTER TABLE public.surveys ALTER COLUMN project_id SET NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. New RPC: get_project_surveys_with_counts
--    Same as get_user_surveys_with_counts but filtered to a single project.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."get_project_surveys_with_counts"(
    "p_user_id" "uuid",
    "p_project_id" "uuid"
) RETURNS "jsonb"
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
          AND s.project_id = p_project_id
    ), '[]'::jsonb);
END;
$$;
