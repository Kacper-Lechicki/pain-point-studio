-- Extend project detail stats timeline to 90 days so UI range "90d" has data.
-- Frontend slices by 7/30/90; RPC was previously fixed at 30 days.

CREATE OR REPLACE FUNCTION "public"."get_project_detail_stats"(
  "p_project_id" "uuid",
  "p_user_id" "uuid"
) RETURNS "jsonb"
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
    SELECT round(avg(extract(epoch FROM (r.completed_at - r.started_at))))::int INTO v_avg_time_seconds
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id
      AND r.status = 'completed' AND r.completed_at IS NOT NULL AND r.started_at IS NOT NULL;

    -- ── KPI: Last response timestamp ─────────────────────────
    SELECT max(r.completed_at) INTO v_last_response_at
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id
      AND r.status = 'completed' AND r.completed_at IS NOT NULL;

    -- ── Chart: Responses over time (last 90 days) ─────────────
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', d.day::text, 'count', COALESCE(cnt.c, 0))
        ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_responses_timeline
    FROM generate_series(v_since, current_date, interval '1 day') AS d(day)
    LEFT JOIN (
        SELECT r.completed_at::date AS rday, count(*) AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.status = 'completed' AND r.completed_at IS NOT NULL
          AND r.completed_at >= v_since
        GROUP BY r.completed_at::date
    ) cnt ON cnt.rday = d.day;

    -- ── Chart: Completion timeline (3 series per day, 90 days) ─
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'date', d.day::text,
            'completed', COALESCE(c.c, 0),
            'inProgress', COALESCE(ip.c, 0),
            'abandoned', COALESCE(a.c, 0)
        ) ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_completion_timeline
    FROM generate_series(v_since, current_date, interval '1 day') AS d(day)
    LEFT JOIN (
        SELECT r.completed_at::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.status = 'completed' AND r.completed_at IS NOT NULL
          AND r.completed_at >= v_since
        GROUP BY r.completed_at::date
    ) c ON c.rday = d.day
    LEFT JOIN (
        SELECT r.created_at::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.status = 'in_progress'
          AND r.created_at >= v_since
        GROUP BY r.created_at::date
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
        'completed', count(*) FILTER (WHERE status = 'completed')
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
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'type', sub.event_type,
            'title', sub.title,
            'timestamp', sub.event_ts,
            'surveyId', sub.survey_id
        )
        ORDER BY sub.event_ts DESC
    ), '[]'::jsonb)
    INTO v_recent_activity
    FROM (
        SELECT * FROM (
            SELECT 'response'::text AS event_type, s.title, r.completed_at AS event_ts, s.id AS survey_id
            FROM public.survey_responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE s.project_id = p_project_id AND s.user_id = p_user_id
              AND r.status = 'completed' AND r.completed_at IS NOT NULL
            ORDER BY r.completed_at DESC LIMIT 5
        ) t1
        UNION ALL
        SELECT * FROM (
            SELECT 'survey_completed'::text, s.title, s.completed_at, s.id
            FROM public.surveys s
            WHERE s.project_id = p_project_id AND s.user_id = p_user_id AND s.completed_at IS NOT NULL
            ORDER BY s.completed_at DESC LIMIT 3
        ) t2
        UNION ALL
        SELECT * FROM (
            SELECT 'survey_activated'::text, s.title, COALESCE(s.starts_at, s.created_at), s.id
            FROM public.surveys s
            WHERE s.project_id = p_project_id AND s.user_id = p_user_id AND s.status = 'active'
            ORDER BY COALESCE(s.starts_at, s.created_at) DESC LIMIT 3
        ) t3
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

ALTER FUNCTION "public"."get_project_detail_stats"("p_project_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";
