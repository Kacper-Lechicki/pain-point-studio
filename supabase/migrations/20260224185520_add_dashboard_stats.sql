-- ============================================================
-- Dashboard Stats: RPC + pinned project column
-- ============================================================
-- 1. Add pinned_project_id to profiles (nullable FK, SET NULL on delete)
-- 2. Create get_dashboard_stats RPC for time-filtered KPI metrics,
--    response timeline, completion rate timeline, and recent activity
-- ============================================================

-- ── 1. Pinned project column ──────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN pinned_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- ── 2. get_dashboard_stats RPC ────────────────────────────────

CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"(
  "p_user_id" "uuid",
  "p_days" int
) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
    v_period_start timestamptz;
    v_prev_start   timestamptz;
    v_total_responses      bigint;
    v_prev_total_responses bigint;
    v_active_surveys       int;
    v_completed_current    bigint;
    v_total_current        bigint;
    v_completed_prev       bigint;
    v_total_prev           bigint;
    v_avg_completion_rate      int;
    v_prev_avg_completion_rate int;
    v_responses_timeline jsonb;
    v_completion_timeline jsonb;
    v_recent_activity    jsonb;
BEGIN
    -- Auth check
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    -- ── Period boundaries ──────────────────────────────────────
    IF p_days > 0 THEN
        v_period_start := now() - (p_days || ' days')::interval;
        v_prev_start   := v_period_start - (p_days || ' days')::interval;
    ELSE
        -- all-time: no period filtering
        v_period_start := NULL;
        v_prev_start   := NULL;
    END IF;

    -- ── KPI: Total completed responses ─────────────────────────
    SELECT count(*)
    INTO v_total_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id
      AND r.status = 'completed'
      AND (v_period_start IS NULL OR r.completed_at >= v_period_start);

    -- Previous period
    IF v_prev_start IS NOT NULL THEN
        SELECT count(*)
        INTO v_prev_total_responses
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.status = 'completed'
          AND r.completed_at >= v_prev_start
          AND r.completed_at < v_period_start;
    ELSE
        v_prev_total_responses := NULL;
    END IF;

    -- ── KPI: Active surveys ────────────────────────────────────
    SELECT count(*)::int
    INTO v_active_surveys
    FROM public.surveys
    WHERE user_id = p_user_id AND status = 'active';

    -- ── KPI: Avg completion rate ───────────────────────────────
    -- Current period: completed / total responses
    SELECT
        count(*) FILTER (WHERE r.status = 'completed'),
        count(*)
    INTO v_completed_current, v_total_current
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id
      AND (v_period_start IS NULL OR r.created_at >= v_period_start);

    IF v_total_current > 0 THEN
        v_avg_completion_rate := round((v_completed_current::numeric / v_total_current) * 100);
    ELSE
        v_avg_completion_rate := 0;
    END IF;

    -- Previous period completion rate
    IF v_prev_start IS NOT NULL THEN
        SELECT
            count(*) FILTER (WHERE r.status = 'completed'),
            count(*)
        INTO v_completed_prev, v_total_prev
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.created_at >= v_prev_start
          AND r.created_at < v_period_start;

        IF v_total_prev > 0 THEN
            v_prev_avg_completion_rate := round((v_completed_prev::numeric / v_total_prev) * 100);
        ELSE
            v_prev_avg_completion_rate := 0;
        END IF;
    ELSE
        v_prev_avg_completion_rate := NULL;
    END IF;

    -- ── Chart: Responses over time (daily) ─────────────────────
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', d.day::text, 'count', COALESCE(cnt.c, 0))
        ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_responses_timeline
    FROM generate_series(
        COALESCE(v_period_start::date, (current_date - interval '29 days')::date),
        current_date,
        interval '1 day'
    ) AS d(day)
    LEFT JOIN (
        SELECT r.completed_at::date AS rday, count(*) AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.status = 'completed'
          AND r.completed_at IS NOT NULL
          AND r.completed_at >= COALESCE(v_period_start, '-infinity'::timestamptz)
        GROUP BY r.completed_at::date
    ) cnt ON cnt.rday = d.day;

    -- ── Chart: Completion rate over time (daily) ───────────────
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', d.day::text, 'rate', COALESCE(rates.rate, 0))
        ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_completion_timeline
    FROM generate_series(
        COALESCE(v_period_start::date, (current_date - interval '29 days')::date),
        current_date,
        interval '1 day'
    ) AS d(day)
    LEFT JOIN (
        SELECT
            r.created_at::date AS rday,
            CASE
                WHEN count(*) > 0
                THEN round((count(*) FILTER (WHERE r.status = 'completed')::numeric / count(*)) * 100)::int
                ELSE 0
            END AS rate
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.created_at >= COALESCE(v_period_start, '-infinity'::timestamptz)
        GROUP BY r.created_at::date
    ) rates ON rates.rday = d.day;

    -- ── Recent activity (last 5 events) ────────────────────────
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
            SELECT
                'response'::text AS event_type,
                s.title,
                r.completed_at AS event_ts,
                s.id AS survey_id
            FROM public.survey_responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE s.user_id = p_user_id
              AND r.status = 'completed'
              AND r.completed_at IS NOT NULL
            ORDER BY r.completed_at DESC
            LIMIT 5
        ) t1

        UNION ALL

        SELECT * FROM (
            SELECT
                'survey_completed'::text AS event_type,
                s.title,
                s.completed_at AS event_ts,
                s.id AS survey_id
            FROM public.surveys s
            WHERE s.user_id = p_user_id
              AND s.completed_at IS NOT NULL
            ORDER BY s.completed_at DESC
            LIMIT 3
        ) t2

        UNION ALL

        SELECT * FROM (
            SELECT
                'survey_activated'::text AS event_type,
                s.title,
                COALESCE(s.starts_at, s.created_at) AS event_ts,
                s.id AS survey_id
            FROM public.surveys s
            WHERE s.user_id = p_user_id
              AND s.status = 'active'
            ORDER BY COALESCE(s.starts_at, s.created_at) DESC
            LIMIT 3
        ) t3
    ) sub;

    -- ── Build result ───────────────────────────────────────────
    RETURN jsonb_build_object(
        'totalResponses',         v_total_responses,
        'prevTotalResponses',     v_prev_total_responses,
        'activeSurveys',          v_active_surveys,
        'avgCompletionRate',      v_avg_completion_rate,
        'prevAvgCompletionRate',  v_prev_avg_completion_rate,
        'responsesTimeline',      v_responses_timeline,
        'completionTimeline',     v_completion_timeline,
        'recentActivity',         v_recent_activity
    );
END;
$$;

ALTER FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" int) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" int) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" int) TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" int) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" int) TO "service_role";
