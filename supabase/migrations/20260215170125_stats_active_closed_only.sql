-- Stats should only count active + closed surveys (not draft, cancelled, archived)

-- ── get_dashboard_overview ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
    v_result jsonb;
    v_total_surveys int;
    v_active_surveys int;
    v_total_responses bigint;
    v_completed_responses bigint;
    v_avg_completion_rate int;
    v_response_timeline jsonb;
    v_top_surveys jsonb;
    v_recent_responses jsonb;
BEGIN
    -- Survey counts (only active + closed count towards stats)
    SELECT
        count(*) FILTER (WHERE status IN ('active', 'closed')),
        count(*) FILTER (WHERE status = 'active')
    INTO v_total_surveys, v_active_surveys
    FROM public.surveys
    WHERE user_id = p_user_id;

    -- Response counts across active + closed surveys only
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

    -- 30-day response timeline across active + closed surveys
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

    -- Top 5 surveys by completed responses (active + closed only)
    SELECT COALESCE(jsonb_agg(row_data ORDER BY completed_count DESC), '[]'::jsonb)
    INTO v_top_surveys
    FROM (
        SELECT jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'status', s.status,
            'completedCount', COALESCE(cc.cnt, 0),
            'slug', s.slug
        ) AS row_data,
        COALESCE(cc.cnt, 0) AS completed_count
        FROM public.surveys s
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            WHERE status = 'completed'
            GROUP BY survey_id
        ) cc ON cc.survey_id = s.id
        WHERE s.user_id = p_user_id AND s.status IN ('active', 'closed')
        ORDER BY COALESCE(cc.cnt, 0) DESC
        LIMIT 5
    ) sub;

    -- Latest 10 completed responses (from active + closed surveys)
    SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
    INTO v_recent_responses
    FROM (
        SELECT jsonb_build_object(
            'surveyId', s.id,
            'surveyTitle', s.title,
            'completedAt', r.completed_at,
            'feedback', r.feedback
        ) AS row_data
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND s.status IN ('active', 'closed')
          AND r.status = 'completed'
        ORDER BY r.completed_at DESC
        LIMIT 10
    ) sub;

    v_result := jsonb_build_object(
        'totalSurveys', v_total_surveys,
        'activeSurveys', v_active_surveys,
        'totalResponses', v_total_responses,
        'completedResponses', v_completed_responses,
        'avgCompletionRate', v_avg_completion_rate,
        'responseTimeline', v_response_timeline,
        'topSurveys', v_top_surveys,
        'recentResponses', v_recent_responses
    );

    RETURN v_result;
END;
$$;


-- ── get_profile_statistics ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION "public"."get_profile_statistics"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
    v_total_surveys int;
    v_total_responses bigint;
    v_completed_responses bigint;
    v_avg_completion_rate int;
    v_member_since timestamptz;
BEGIN
    -- Count only active + closed surveys
    SELECT count(*)
    INTO v_total_surveys
    FROM public.surveys
    WHERE user_id = p_user_id AND status IN ('active', 'closed');

    -- Count responses across active + closed surveys only
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

    -- Member since from auth.users
    SELECT created_at INTO v_member_since
    FROM auth.users
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'totalSurveys', v_total_surveys,
        'totalResponses', v_total_responses,
        'completedResponses', v_completed_responses,
        'avgCompletionRate', v_avg_completion_rate,
        'memberSince', v_member_since
    );
END;
$$;
