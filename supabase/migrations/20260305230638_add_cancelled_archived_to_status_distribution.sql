-- Update get_project_detail_stats to include cancelled and archived in survey status distribution
CREATE OR REPLACE FUNCTION "public"."get_project_detail_stats"("p_project_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_total_surveys         int;
    v_active_surveys        int;
    v_total_responses       bigint;
    v_completed_responses   bigint;
    v_total_all_responses   bigint;
    v_avg_completion        int;
    v_avg_time_seconds      int;
    v_last_response_at      timestamptz;
    v_responses_timeline    jsonb;
    v_completion_timeline   jsonb;
    v_status_distribution   jsonb;
    v_completion_breakdown  jsonb;
    v_recent_activity       jsonb;
    v_since                 date := (current_date - interval '89 days')::date;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p_project_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'NOT_FOUND';
    END IF;

    -- ── KPI: Total surveys in project ────────────────────────
    SELECT count(*)::int INTO v_total_surveys
    FROM public.surveys
    WHERE project_id = p_project_id AND user_id = p_user_id;

    -- ── KPI: Active surveys ──────────────────────────────────
    SELECT count(*)::int INTO v_active_surveys
    FROM public.surveys
    WHERE project_id = p_project_id AND user_id = p_user_id AND status = 'active';

    -- ── KPI: Total completed responses ───────────────────────
    SELECT count(*) INTO v_total_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id AND r.status = 'completed';

    -- ── KPI: Avg completion rate ─────────────────────────────
    SELECT count(*) FILTER (WHERE r.status = 'completed'), count(*)
    INTO v_completed_responses, v_total_all_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id;

    IF v_total_all_responses > 0 THEN
        v_avg_completion := round((v_completed_responses::numeric / v_total_all_responses) * 100);
    ELSE
        v_avg_completion := 0;
    END IF;

    -- ── KPI: Avg completion time (seconds) ───────────────────
    SELECT round(extract(epoch FROM avg(r.updated_at - r.created_at)))::int
    INTO v_avg_time_seconds
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id AND r.status = 'completed';

    -- ── KPI: Last response at ────────────────────────────────
    SELECT max(r.created_at)
    INTO v_last_response_at
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id;

    -- ── Chart: Responses timeline (last 90 days) ─────────────
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', d.day, 'count', COALESCE(c.cnt, 0))
        ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_responses_timeline
    FROM generate_series(v_since, current_date, '1 day') AS d(day)
    LEFT JOIN (
        SELECT (r.created_at)::date AS rday, count(*)::int AS cnt
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.created_at >= v_since
        GROUP BY (r.created_at)::date
    ) c ON c.rday = d.day;

    -- ── Chart: Completion timeline (last 90 days) ────────────
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'date', d.day,
            'completed', COALESCE(comp.c, 0),
            'inProgress', COALESCE(ip.c, 0),
            'abandoned', COALESCE(a.c, 0)
        ) ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_completion_timeline
    FROM generate_series(v_since, current_date, '1 day') AS d(day)
    LEFT JOIN (
        SELECT (r.updated_at)::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.status = 'completed'
          AND r.updated_at >= v_since
        GROUP BY (r.updated_at)::date
    ) comp ON comp.rday = d.day
    LEFT JOIN (
        SELECT (r.updated_at)::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.status = 'in_progress'
          AND r.updated_at >= v_since
        GROUP BY (r.updated_at)::date
    ) ip ON ip.rday = d.day
    LEFT JOIN (
        SELECT (r.updated_at)::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.status = 'abandoned'
          AND r.updated_at >= v_since
        GROUP BY (r.updated_at)::date
    ) a ON a.rday = d.day;

    -- ── Chart: Survey status distribution ────────────────────
    SELECT jsonb_build_object(
        'draft',     count(*) FILTER (WHERE status = 'draft'),
        'active',    count(*) FILTER (WHERE status = 'active'),
        'completed', count(*) FILTER (WHERE status = 'completed'),
        'cancelled', count(*) FILTER (WHERE status = 'cancelled'),
        'archived',  count(*) FILTER (WHERE status = 'archived')
    )
    INTO v_status_distribution
    FROM public.surveys
    WHERE project_id = p_project_id AND user_id = p_user_id;

    -- ── Chart: Completion breakdown (aggregate) ──────────────
    SELECT jsonb_build_object(
        'completed',  count(*) FILTER (WHERE r.status = 'completed'),
        'inProgress', count(*) FILTER (WHERE r.status = 'in_progress'),
        'abandoned',  count(*) FILTER (WHERE r.status = 'abandoned')
    )
    INTO v_completion_breakdown
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id;

    -- ── Recent activity (last 5 events) ──────────────────────
    SELECT COALESCE(jsonb_agg(sub.evt ORDER BY sub.ts DESC), '[]'::jsonb)
    INTO v_recent_activity
    FROM (
        (
            SELECT jsonb_build_object(
                'type', 'response',
                'title', s.title,
                'timestamp', r.created_at,
                'surveyId', s.id
            ) AS evt, r.created_at AS ts
            FROM public.survey_responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE s.project_id = p_project_id AND s.user_id = p_user_id
            ORDER BY r.created_at DESC LIMIT 3
        )
        UNION ALL
        (
            SELECT jsonb_build_object(
                'type', 'survey_started',
                'title', s.title,
                'timestamp', COALESCE(s.starts_at, s.created_at),
                'surveyId', s.id
            ) AS evt, COALESCE(s.starts_at, s.created_at) AS ts
            FROM public.surveys s
            WHERE s.project_id = p_project_id AND s.user_id = p_user_id AND s.status = 'active'
            ORDER BY COALESCE(s.starts_at, s.created_at) DESC LIMIT 3
        )
    ) sub;

    RETURN jsonb_build_object(
        'totalSurveys',            v_total_surveys,
        'activeSurveys',           v_active_surveys,
        'totalResponses',          v_total_responses,
        'avgCompletion',           v_avg_completion,
        'avgTimeSeconds',           v_avg_time_seconds,
        'lastResponseAt',           v_last_response_at,
        'responsesTimeline',       v_responses_timeline,
        'completionTimeline',      v_completion_timeline,
        'surveyStatusDistribution', v_status_distribution,
        'completionBreakdown',     v_completion_breakdown,
        'recentActivity',          v_recent_activity
    );
END;
$$;
