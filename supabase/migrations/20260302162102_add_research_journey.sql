-- ============================================================
-- Research Journey: RPC for profile milestone timeline
-- ============================================================
-- Returns the dates of key research milestones for a user:
-- when they joined, created their first project, published
-- their first survey, received their first response, and
-- the total number of completed responses (for threshold
-- milestones like 10, 50, 100, etc.).
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."get_research_journey"(
  "p_user_id" "uuid"
) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
  v_member_since      timestamptz;
  v_first_project_at  timestamptz;
  v_first_survey_at   timestamptz;
  v_first_response_at timestamptz;
  v_total_responses   bigint;
BEGIN
  -- Ownership check: caller must be the requested user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  -- When the user joined
  SELECT created_at INTO v_member_since
  FROM auth.users
  WHERE id = p_user_id;

  -- When the user created their first project
  SELECT MIN(created_at) INTO v_first_project_at
  FROM public.projects
  WHERE user_id = p_user_id;

  -- When the user first published a survey (active or completed)
  SELECT MIN(COALESCE(starts_at, created_at)) INTO v_first_survey_at
  FROM public.surveys
  WHERE user_id = p_user_id
    AND status IN ('active', 'completed');

  -- When the user received their first completed response
  SELECT MIN(r.completed_at) INTO v_first_response_at
  FROM public.survey_responses r
  JOIN public.surveys s ON s.id = r.survey_id
  WHERE s.user_id = p_user_id
    AND r.status = 'completed';

  -- Total completed responses across all surveys
  SELECT COUNT(*) INTO v_total_responses
  FROM public.survey_responses r
  JOIN public.surveys s ON s.id = r.survey_id
  WHERE s.user_id = p_user_id
    AND r.status = 'completed';

  RETURN jsonb_build_object(
    'memberSince',     v_member_since,
    'firstProjectAt',  v_first_project_at,
    'firstSurveyAt',   v_first_survey_at,
    'firstResponseAt', v_first_response_at,
    'totalResponses',  v_total_responses
  );
END;
$$;

ALTER FUNCTION "public"."get_research_journey"("p_user_id" "uuid") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_research_journey"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_research_journey"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_research_journey"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_research_journey"("p_user_id" "uuid") TO "service_role";
