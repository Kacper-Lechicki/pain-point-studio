-- =============================================================================
-- Audit fix: add starts_at / ends_at checks to start_survey_response
-- =============================================================================
-- The RPC previously only checked `status = 'active'`. Between cron runs
-- (every 15 min), a survey past its ends_at or before its starts_at would
-- still have status = 'active'. This allowed respondents to start responses
-- on time-expired surveys via direct calls. Now the RPC enforces time bounds.
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."start_survey_response"(
  "p_survey_id" "uuid",
  "p_device_type" "text" DEFAULT NULL::"text",
  "p_fingerprint" "text" DEFAULT NULL::"text"
) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
  v_max integer;
  v_current integer;
  v_status text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_response_id uuid;
  v_existing_count integer;
BEGIN
  SELECT status, max_respondents, starts_at, ends_at
    INTO v_status, v_max, v_starts_at, v_ends_at
    FROM public.surveys
   WHERE id = p_survey_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SURVEY_NOT_FOUND';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
  END IF;

  -- Enforce time bounds even when cron hasn't updated the status yet.
  IF v_starts_at IS NOT NULL AND v_starts_at > now() THEN
    RAISE EXCEPTION 'SURVEY_NOT_STARTED';
  END IF;

  IF v_ends_at IS NOT NULL AND v_ends_at < now() THEN
    RAISE EXCEPTION 'SURVEY_EXPIRED';
  END IF;

  -- Deduplication: warn if this fingerprint already has a completed response.
  IF p_fingerprint IS NOT NULL THEN
    SELECT count(*)
      INTO v_existing_count
      FROM public.survey_responses
     WHERE survey_id = p_survey_id
       AND fingerprint = p_fingerprint
       AND status = 'completed';

    IF v_existing_count > 0 THEN
      RAISE EXCEPTION 'DUPLICATE_RESPONSE';
    END IF;
  END IF;

  IF v_max IS NOT NULL THEN
    SELECT count(*)
      INTO v_current
      FROM public.survey_responses
     WHERE survey_id = p_survey_id
       AND (
         status = 'completed'
         OR (status = 'in_progress' AND started_at > now() - interval '24 hours')
       )
       AND submitted_after_close = false;

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'MAX_RESPONDENTS_REACHED';
    END IF;
  END IF;

  INSERT INTO public.survey_responses (survey_id, device_type, fingerprint)
  VALUES (p_survey_id, p_device_type, p_fingerprint)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;
