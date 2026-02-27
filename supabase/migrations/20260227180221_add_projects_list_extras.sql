-- ============================================================
-- Projects List Extras: batch data for Smart Status + Sparkline
-- ============================================================
-- Returns per-project survey breakdown and 14-day response
-- sparkline for all projects owned by a user.
-- Used by the projects list page to render Smart Status badges
-- and activity sparkline charts.
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."get_projects_list_extras"(
  "p_user_id" "uuid"
) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Auth check: caller must be the user
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    SELECT COALESCE(jsonb_object_agg(proj.id::text, jsonb_build_object(
        'draftCount',     COALESCE(sc.draft_count, 0),
        'activeCount',    COALESCE(sc.active_count, 0),
        'completedCount', COALESCE(sc.completed_count, 0),
        'nearestEndsAt',  sc.nearest_ends_at,
        'sparkline',      COALESCE(sp.points, '[]'::jsonb)
    )), '{}'::jsonb)
    INTO v_result
    FROM public.projects proj

    -- Survey status counts + nearest ends_at per project
    LEFT JOIN LATERAL (
        SELECT
            count(*) FILTER (WHERE s.status = 'draft')::int     AS draft_count,
            count(*) FILTER (WHERE s.status = 'active')::int    AS active_count,
            count(*) FILTER (WHERE s.status = 'completed')::int AS completed_count,
            min(s.ends_at) FILTER (WHERE s.status = 'active' AND s.ends_at IS NOT NULL)
                AS nearest_ends_at
        FROM public.surveys s
        WHERE s.project_id = proj.id AND s.user_id = p_user_id
    ) sc ON true

    -- 14-day sparkline: daily completed response counts per project
    LEFT JOIN LATERAL (
        SELECT jsonb_agg(
            jsonb_build_object('date', d.day::text, 'count', COALESCE(cnt.c, 0))
            ORDER BY d.day
        ) AS points
        FROM generate_series(
            (current_date - interval '13 days')::date,
            current_date,
            interval '1 day'
        ) AS d(day)
        LEFT JOIN (
            SELECT r.completed_at::date AS rday, count(*)::int AS c
            FROM public.survey_responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE s.project_id = proj.id
              AND s.user_id = p_user_id
              AND r.status = 'completed'
              AND r.completed_at IS NOT NULL
              AND r.completed_at >= (current_date - interval '13 days')
            GROUP BY r.completed_at::date
        ) cnt ON cnt.rday = d.day
    ) sp ON true

    WHERE proj.user_id = p_user_id;

    RETURN v_result;
END;
$$;

ALTER FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") TO "service_role";
