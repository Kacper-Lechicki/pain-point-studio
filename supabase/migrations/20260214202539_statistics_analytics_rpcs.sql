-- ═══════════════════════════════════════════════════════════════════════
-- Statistics & Analytics RPCs
-- ═══════════════════════════════════════════════════════════════════════
-- 1. Enhanced get_survey_stats_data (add timeline, avg completion time, first/last response)
-- 2. New: get_dashboard_overview (aggregate metrics for dashboard home)
-- 3. New: get_profile_statistics (concise user stats for profile page)
-- 4. New: get_analytics_data (cross-survey analytics)
-- 5. Enable Realtime on survey_responses
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- 1. Enhanced get_survey_stats_data
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "public"."get_survey_stats_data"("p_survey_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
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
        -- NEW: 30-day daily response counts
        'responseTimeline', COALESCE((
            SELECT jsonb_agg(day_count ORDER BY day)
            FROM (
                SELECT d.day, COALESCE(cnt.c, 0) AS day_count
                FROM generate_series(
                    (current_date - interval '29 days')::date,
                    current_date,
                    interval '1 day'
                ) AS d(day)
                LEFT JOIN (
                    SELECT created_at::date AS rday, count(*) AS c
                    FROM public.survey_responses
                    WHERE survey_id = p_survey_id AND status = 'completed'
                      AND created_at >= (current_date - interval '29 days')
                    GROUP BY created_at::date
                ) cnt ON cnt.rday = d.day
            ) sub
        ), '[]'::jsonb),
        -- NEW: average completion time in seconds
        'avgCompletionSeconds', (
            SELECT EXTRACT(EPOCH FROM avg(completed_at - started_at))::int
            FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'completed' AND completed_at IS NOT NULL AND started_at IS NOT NULL
        ),
        -- NEW: first and last response timestamps
        'firstResponseAt', (
            SELECT min(created_at) FROM public.survey_responses WHERE survey_id = p_survey_id
        ),
        'lastResponseAt', (
            SELECT max(created_at) FROM public.survey_responses WHERE survey_id = p_survey_id
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


-- ─────────────────────────────────────────────────────────────────────
-- 2. get_dashboard_overview
-- ─────────────────────────────────────────────────────────────────────

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
    -- Survey counts
    SELECT
        count(*) FILTER (WHERE status != 'archived'),
        count(*) FILTER (WHERE status = 'active')
    INTO v_total_surveys, v_active_surveys
    FROM public.surveys
    WHERE user_id = p_user_id;

    -- Response counts across all user surveys
    SELECT
        count(*),
        count(*) FILTER (WHERE r.status = 'completed')
    INTO v_total_responses, v_completed_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id;

    -- Average completion rate
    IF v_total_responses > 0 THEN
        v_avg_completion_rate := round((v_completed_responses::numeric / v_total_responses) * 100);
    ELSE
        v_avg_completion_rate := 0;
    END IF;

    -- 30-day response timeline across all surveys
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
              AND r.status = 'completed'
              AND r.created_at >= (current_date - interval '29 days')
            GROUP BY r.created_at::date
        ) cnt ON cnt.rday = d.day
    ) sub;

    -- Top 5 surveys by completed responses
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
        WHERE s.user_id = p_user_id AND s.status != 'archived'
        ORDER BY COALESCE(cc.cnt, 0) DESC
        LIMIT 5
    ) sub;

    -- Latest 10 completed responses
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
        WHERE s.user_id = p_user_id AND r.status = 'completed'
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

ALTER FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") TO "service_role";
REVOKE ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") FROM "anon";


-- ─────────────────────────────────────────────────────────────────────
-- 3. get_profile_statistics
-- ─────────────────────────────────────────────────────────────────────

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
    -- Count non-archived surveys
    SELECT count(*)
    INTO v_total_surveys
    FROM public.surveys
    WHERE user_id = p_user_id AND status != 'archived';

    -- Count responses across all user surveys
    SELECT
        count(*),
        count(*) FILTER (WHERE r.status = 'completed')
    INTO v_total_responses, v_completed_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id;

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
        'avgCompletionRate', v_avg_completion_rate,
        'memberSince', v_member_since
    );
END;
$$;

ALTER FUNCTION "public"."get_profile_statistics"("p_user_id" "uuid") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_profile_statistics"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_statistics"("p_user_id" "uuid") TO "service_role";
REVOKE ALL ON FUNCTION "public"."get_profile_statistics"("p_user_id" "uuid") FROM "anon";


-- ─────────────────────────────────────────────────────────────────────
-- 4. get_analytics_data
-- ─────────────────────────────────────────────────────────────────────

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
    -- Aggregate response counts
    SELECT
        count(*),
        count(*) FILTER (WHERE r.status = 'completed')
    INTO v_total_responses, v_completed_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id;

    -- Average completion rate
    IF v_total_responses > 0 THEN
        v_avg_completion_rate := round((v_completed_responses::numeric / v_total_responses) * 100);
    ELSE
        v_avg_completion_rate := 0;
    END IF;

    -- 30-day response timeline
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
              AND r.status = 'completed'
              AND r.created_at >= (current_date - interval '29 days')
            GROUP BY r.created_at::date
        ) cnt ON cnt.rday = d.day
    ) sub;

    -- Category breakdown: surveys and responses per category
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
        WHERE s.user_id = p_user_id AND s.status NOT IN ('draft', 'archived')
        GROUP BY s.category
    ) sub;

    -- Per-survey comparison metrics
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
        WHERE s.user_id = p_user_id AND s.status NOT IN ('draft', 'archived')
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

ALTER FUNCTION "public"."get_analytics_data"("p_user_id" "uuid") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_analytics_data"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_analytics_data"("p_user_id" "uuid") TO "service_role";
REVOKE ALL ON FUNCTION "public"."get_analytics_data"("p_user_id" "uuid") FROM "anon";


-- ─────────────────────────────────────────────────────────────────────
-- 5. Enable Realtime on survey_responses
-- ─────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.survey_responses;
