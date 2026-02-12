-- =============================================================================
-- 1. Fix broken RLS policies on survey_responses and survey_answers
--    The "Anyone can read response by id" and "Anyone can read own answers by
--    response id" policies incorrectly use OR logic that grants ALL anonymous
--    users access to ALL rows. Anonymous respondents only need INSERT/UPDATE
--    (already covered), not SELECT.
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can read response by id" ON "public"."survey_responses";
DROP POLICY IF EXISTS "Anyone can read own answers by response id" ON "public"."survey_answers";


-- =============================================================================
-- 2. Single-query function for user surveys with response counts
--    Replaces N+1 pattern (1 RPC per survey) with a single aggregated query.
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."get_user_surveys_with_counts"(
    p_user_id "uuid"
)
RETURNS "jsonb"
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
SET "search_path" TO ''
AS $$
BEGIN
    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'title', s.title,
                'description', s.description,
                'category', s.category,
                'status', s.status,
                'slug', s.slug,
                'responseCount', COALESCE(rc.cnt, 0),
                'createdAt', s.created_at,
                'updatedAt', s.updated_at
            ) ORDER BY s.updated_at DESC
        )
        FROM public.surveys s
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            GROUP BY survey_id
        ) rc ON rc.survey_id = s.id
        WHERE s.user_id = p_user_id
    ), '[]'::jsonb);
END;
$$;

ALTER FUNCTION "public"."get_user_surveys_with_counts"("uuid") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_user_surveys_with_counts"("uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_surveys_with_counts"("uuid") TO "service_role";
