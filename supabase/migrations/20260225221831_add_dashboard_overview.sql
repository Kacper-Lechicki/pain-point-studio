-- ============================================================
-- Dashboard Overview: RPC for project list with survey/response counts
-- ============================================================
-- Replaces client-side aggregation in get-dashboard-overview.ts
-- with a single SQL query that computes surveyCount and responseCount
-- per active project.
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."get_dashboard_overview"(
  "p_user_id" "uuid"
) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
AS $$
BEGIN
    -- Auth check
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(row_data ORDER BY updated_at DESC)
        FROM (
            SELECT
                jsonb_build_object(
                    'id', p.id,
                    'name', p.name,
                    'description', p.description,
                    'status', p.status,
                    'updatedAt', p.updated_at,
                    'surveyCount', COUNT(DISTINCT s.id)::int,
                    'responseCount', COALESCE(SUM(resp_counts.cnt), 0)::int
                ) AS row_data,
                p.updated_at
            FROM public.projects p
            LEFT JOIN public.surveys s ON s.project_id = p.id
            LEFT JOIN (
                SELECT survey_id, COUNT(*)::int AS cnt
                FROM public.survey_responses
                GROUP BY survey_id
            ) resp_counts ON resp_counts.survey_id = s.id
            WHERE p.user_id = p_user_id AND p.status = 'active'
            GROUP BY p.id, p.name, p.description, p.status, p.updated_at
        ) sub
    ), '[]'::jsonb);
END;
$$;

ALTER FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") TO "service_role";
