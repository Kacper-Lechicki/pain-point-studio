-- ═══════════════════════════════════════════════════════════════════════
-- get_survey_responses_list: Paginated, filterable response list
-- with decrypted contact info. Used by the Responses tab.
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION "public"."get_survey_responses_list"(
  "p_survey_id" "uuid",
  "p_user_id"   "uuid",
  "p_page"      integer DEFAULT 1,
  "p_per_page"  integer DEFAULT 20,
  "p_status"    "text"  DEFAULT NULL,
  "p_device"    "text"  DEFAULT NULL,
  "p_has_contact" boolean DEFAULT NULL,
  "p_search"    "text"  DEFAULT NULL,
  "p_sort_by"   "text"  DEFAULT 'completed_at',
  "p_sort_dir"  "text"  DEFAULT 'desc',
  "p_date_from" timestamptz DEFAULT NULL,
  "p_date_to"   timestamptz DEFAULT NULL
)
RETURNS "jsonb"
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
SET "search_path" TO ''
AS $$
DECLARE
  v_offset     integer;
  v_result     jsonb;
BEGIN
  -- Verify the caller owns this survey
  IF NOT EXISTS (
    SELECT 1 FROM public.surveys
    WHERE surveys.id = p_survey_id AND surveys.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  -- Clamp pagination
  IF p_page < 1 THEN p_page := 1; END IF;
  IF p_per_page < 1 THEN p_per_page := 20; END IF;
  IF p_per_page > 100 THEN p_per_page := 100; END IF;

  v_offset := (p_page - 1) * p_per_page;

  WITH filtered AS (
    SELECT
      sr.id,
      sr.status,
      sr.started_at,
      sr.completed_at,
      sr.device_type,
      CASE
        WHEN sr.completed_at IS NOT NULL AND sr.started_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM sr.completed_at - sr.started_at)::integer
        ELSE NULL
      END AS duration_seconds,
      public.decrypt_pii(sr.contact_name_encrypted) AS contact_name,
      public.decrypt_pii(sr.contact_email_encrypted) AS contact_email,
      (SELECT count(*)::integer FROM public.survey_answers sa WHERE sa.response_id = sr.id) AS answer_count,
      sr.feedback
    FROM public.survey_responses sr
    WHERE sr.survey_id = p_survey_id
      AND (p_status IS NULL OR sr.status = p_status)
      AND (p_device IS NULL OR sr.device_type = p_device)
      AND (
        p_has_contact IS NULL
        OR (p_has_contact = true AND sr.contact_email_encrypted IS NOT NULL)
        OR (p_has_contact = false AND sr.contact_email_encrypted IS NULL)
      )
      AND (p_date_from IS NULL OR sr.started_at >= p_date_from)
      AND (p_date_to IS NULL OR sr.started_at <= p_date_to)
  ),
  searched AS (
    SELECT f.*
    FROM filtered f
    WHERE p_search IS NULL
       OR f.contact_name ILIKE '%' || p_search || '%'
       OR f.contact_email ILIKE '%' || p_search || '%'
  ),
  total AS (
    SELECT count(*)::integer AS cnt FROM searched
  ),
  sorted AS (
    SELECT s.*
    FROM searched s
    ORDER BY
      CASE WHEN p_sort_by = 'completed_at' AND p_sort_dir = 'desc' THEN s.completed_at END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'completed_at' AND p_sort_dir = 'asc'  THEN s.completed_at END ASC  NULLS LAST,
      CASE WHEN p_sort_by = 'started_at'   AND p_sort_dir = 'desc' THEN s.started_at   END DESC,
      CASE WHEN p_sort_by = 'started_at'   AND p_sort_dir = 'asc'  THEN s.started_at   END ASC,
      CASE WHEN p_sort_by = 'duration'     AND p_sort_dir = 'desc' THEN s.duration_seconds END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'duration'     AND p_sort_dir = 'asc'  THEN s.duration_seconds END ASC  NULLS LAST,
      s.started_at DESC  -- fallback
    LIMIT p_per_page OFFSET v_offset
  )
  SELECT jsonb_build_object(
    'totalCount', (SELECT cnt FROM total),
    'items', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id',              s.id,
          'status',          s.status,
          'startedAt',       s.started_at,
          'completedAt',     s.completed_at,
          'deviceType',      s.device_type,
          'durationSeconds', s.duration_seconds,
          'contactName',     s.contact_name,
          'contactEmail',    s.contact_email,
          'answerCount',     s.answer_count,
          'feedback',        s.feedback
        )
       )
       FROM sorted s),
      '[]'::jsonb
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════
-- get_response_detail: Full response with all answers (Q&A pairs).
-- Used by the response detail modal.
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION "public"."get_response_detail"(
  "p_response_id" "uuid",
  "p_user_id"     "uuid"
)
RETURNS "jsonb"
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
SET "search_path" TO ''
AS $$
DECLARE
  v_survey_id uuid;
  v_result    jsonb;
BEGIN
  -- Look up the survey for this response and verify ownership
  SELECT sr.survey_id INTO v_survey_id
  FROM public.survey_responses sr
  JOIN public.surveys s ON s.id = sr.survey_id
  WHERE sr.id = p_response_id AND s.user_id = p_user_id;

  IF v_survey_id IS NULL THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  SELECT jsonb_build_object(
    'id',              sr.id,
    'status',          sr.status,
    'startedAt',       sr.started_at,
    'completedAt',     sr.completed_at,
    'deviceType',      sr.device_type,
    'durationSeconds', CASE
      WHEN sr.completed_at IS NOT NULL AND sr.started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM sr.completed_at - sr.started_at)::integer
      ELSE NULL
    END,
    'contactName',     public.decrypt_pii(sr.contact_name_encrypted),
    'contactEmail',    public.decrypt_pii(sr.contact_email_encrypted),
    'feedback',        sr.feedback,
    'answers',         COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'questionId',     sq.id,
          'questionText',   sq.text,
          'questionType',   sq.type,
          'questionConfig', sq.config,
          'sortOrder',      sq.sort_order,
          'value',          sa.value
        )
        ORDER BY sq.sort_order
      )
      FROM public.survey_answers sa
      JOIN public.survey_questions sq ON sq.id = sa.question_id
      WHERE sa.response_id = sr.id),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM public.survey_responses sr
  WHERE sr.id = p_response_id;

  RETURN v_result;
END;
$$;
