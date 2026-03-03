-- =============================================================================
-- Audit fixes: grace period for expired surveys + respondent deduplication
-- =============================================================================

-- ── 1. Grace period: flag responses submitted after survey close ─────────────

ALTER TABLE "public"."survey_responses"
  ADD COLUMN IF NOT EXISTS "submitted_after_close" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."survey_responses"."submitted_after_close"
  IS 'True when the response was submitted after the survey ended. These responses are preserved but excluded from statistics.';

-- ── 2. Deduplication: browser fingerprint for detecting repeat submissions ───

ALTER TABLE "public"."survey_responses"
  ADD COLUMN IF NOT EXISTS "fingerprint" text;

COMMENT ON COLUMN "public"."survey_responses"."fingerprint"
  IS 'Hash of IP + user-agent, used to detect duplicate submissions from the same browser.';

-- ── 3. Update submit_survey_response to flag late submissions ────────────────

CREATE OR REPLACE FUNCTION "public"."submit_survey_response"(
  "p_response_id" "uuid",
  "p_contact_name" "text" DEFAULT NULL::"text",
  "p_contact_email" "text" DEFAULT NULL::"text",
  "p_feedback" "text" DEFAULT NULL::"text"
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
AS $$
DECLARE
    v_survey_id uuid;
    v_status text;
    v_max integer;
    v_completed integer;
    v_ends_at timestamptz;
    v_is_late boolean := false;
BEGIN
    SELECT survey_id, status
      INTO v_survey_id, v_status
      FROM public.survey_responses
     WHERE id = p_response_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_status != 'in_progress' THEN
        RAISE EXCEPTION 'RESPONSE_ALREADY_COMPLETED';
    END IF;

    -- Check if the survey has ended since this response was started.
    SELECT ends_at INTO v_ends_at
      FROM public.surveys
     WHERE id = v_survey_id;

    IF v_ends_at IS NOT NULL AND v_ends_at < now() THEN
        v_is_late := true;
    END IF;

    UPDATE public.survey_responses
    SET status = 'completed',
        contact_name_encrypted = public.encrypt_pii(p_contact_name),
        contact_email_encrypted = public.encrypt_pii(p_contact_email),
        feedback = p_feedback,
        completed_at = now(),
        updated_at = now(),
        submitted_after_close = v_is_late
    WHERE id = p_response_id;

    -- Only count non-late responses toward max_respondents auto-complete.
    IF NOT v_is_late THEN
        SELECT max_respondents
          INTO v_max
          FROM public.surveys
         WHERE id = v_survey_id;

        IF v_max IS NOT NULL THEN
            SELECT count(*)
              INTO v_completed
              FROM public.survey_responses
             WHERE survey_id = v_survey_id
               AND status = 'completed'
               AND submitted_after_close = false;

            IF v_completed >= v_max THEN
                UPDATE public.surveys
                SET status = 'completed',
                    completed_at = now(),
                    updated_at = now()
                WHERE id = v_survey_id
                  AND status = 'active';
            END IF;
        END IF;
    END IF;
END;
$$;

-- ── 4. Update get_survey_response_count to exclude late submissions ──────────

CREATE OR REPLACE FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
AS $$
    SELECT COALESCE(COUNT(*)::integer, 0)
    FROM public.survey_responses
    WHERE survey_id = p_survey_id
      AND status = 'completed'
      AND submitted_after_close = false;
$$;

-- ── 5. Update start_survey_response to accept and check fingerprint ──────────

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
  v_response_id uuid;
  v_existing_count integer;
BEGIN
  SELECT status, max_respondents
    INTO v_status, v_max
    FROM public.surveys
   WHERE id = p_survey_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SURVEY_NOT_FOUND';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
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

-- Drop the old 2-param overload to avoid ambiguity with the new 3-param version.
-- The old version only had (uuid, text). The new one has (uuid, text, text).
-- Since both have defaults, PG can resolve calls by arity. No drop needed —
-- CREATE OR REPLACE already updated the 2-param version in-place (same name, compatible signature).
