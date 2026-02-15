-- Analytics should only count active + closed surveys (consistent with dashboard overview)

CREATE OR REPLACE FUNCTION "public"."get_analytics_data"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
    v_total_responses bigint;
    v_completed_responses bigint;
    v_avg_completion_rate int;
    v_response_timeline jsonb;
    v_category_breakdown jsonb;
    v_survey_comparison jsonb;
BEGIN
    -- Aggregate response counts (active + closed surveys only)
    SELECT
        count(*),
        count(*) FILTER (WHERE r.status = 'completed')
    INTO v_total_responses, v_completed_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id
      AND s.status IN ('active', 'closed');

    -- Average completion rate
    IF v_total_responses > 0 THEN
        v_avg_completion_rate := round((v_completed_responses::numeric / v_total_responses) * 100);
    ELSE
        v_avg_completion_rate := 0;
    END IF;

    -- 30-day response timeline (active + closed surveys only)
    SELECT COALESCE(jsonb_agg(day_count ORDER BY day), '[]'::jsonb)
    INTO v_response_timeline
    FROM (
        SELECT d.day, COALESCE(cnt.c, 0) AS day_count
        FROM generate_series(
            (current_date - interval '29 days')::date,
            current_date,
            interval '1 day'
        ) AS d(day)
        LEFT JOIN (
            SELECT r.created_at::date AS rday, count(*) AS c
            FROM public.survey_responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE s.user_id = p_user_id
              AND s.status IN ('active', 'closed')
              AND r.status = 'completed'
              AND r.created_at >= (current_date - interval '29 days')
            GROUP BY r.created_at::date
        ) cnt ON cnt.rday = d.day
    ) sub;

    -- Category breakdown: surveys and responses per category (active + closed only)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'category', sub.category,
            'count', sub.survey_count,
            'totalResponses', sub.total_responses
        ) ORDER BY sub.total_responses DESC
    ), '[]'::jsonb)
    INTO v_category_breakdown
    FROM (
        SELECT
            s.category,
            count(DISTINCT s.id) AS survey_count,
            count(r.id) FILTER (WHERE r.status = 'completed') AS total_responses
        FROM public.surveys s
        LEFT JOIN public.survey_responses r ON r.survey_id = s.id
        WHERE s.user_id = p_user_id AND s.status IN ('active', 'closed')
        GROUP BY s.category
    ) sub;

    -- Per-survey comparison metrics (active + closed only)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', sub.id,
            'title', sub.title,
            'status', sub.status,
            'category', sub.category,
            'completedCount', sub.completed_count,
            'completionRate', sub.completion_rate,
            'questionCount', sub.question_count,
            'createdAt', sub.created_at
        ) ORDER BY sub.completed_count DESC
    ), '[]'::jsonb)
    INTO v_survey_comparison
    FROM (
        SELECT
            s.id,
            s.title,
            s.status,
            s.category,
            s.created_at,
            COALESCE(cc.cnt, 0) AS completed_count,
            COALESCE(qc.cnt, 0) AS question_count,
            CASE WHEN COALESCE(tc.cnt, 0) > 0
                THEN round((COALESCE(cc.cnt, 0)::numeric / tc.cnt) * 100)::int
                ELSE 0
            END AS completion_rate
        FROM public.surveys s
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses WHERE status = 'completed'
            GROUP BY survey_id
        ) cc ON cc.survey_id = s.id
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            GROUP BY survey_id
        ) tc ON tc.survey_id = s.id
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_questions
            GROUP BY survey_id
        ) qc ON qc.survey_id = s.id
        WHERE s.user_id = p_user_id AND s.status IN ('active', 'closed')
    ) sub;

    RETURN jsonb_build_object(
        'responseTimeline', v_response_timeline,
        'totalResponses', v_total_responses,
        'completedResponses', v_completed_responses,
        'avgCompletionRate', v_avg_completion_rate,
        'categoryBreakdown', v_category_breakdown,
        'surveyComparison', v_survey_comparison
    );
END;
$$;
