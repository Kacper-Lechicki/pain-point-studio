-- Auto-close survey when maxRespondents cap is reached upon response submission.
-- Also add `surveys` table to Realtime publication so the dashboard can detect
-- status changes (e.g. auto-close) without a manual reload.

-- 1. Replace submit_survey_response to add auto-close logic
CREATE OR REPLACE FUNCTION "public"."submit_survey_response"(
    "p_response_id" "uuid",
    "p_contact_name" "text" DEFAULT NULL::"text",
    "p_contact_email" "text" DEFAULT NULL::"text",
    "p_feedback" "text" DEFAULT NULL::"text"
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_survey_id uuid;
    v_status text;
    v_max integer;
    v_completed integer;
BEGIN
    SELECT survey_id, status
      INTO v_survey_id, v_status
      FROM survey_responses
     WHERE id = p_response_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_status != 'in_progress' THEN
        RAISE EXCEPTION 'RESPONSE_ALREADY_COMPLETED';
    END IF;

    -- Empty submissions are allowed — they count as a completed response
    -- with 0% per-question response rate in analytics.

    UPDATE survey_responses
    SET status = 'completed',
        contact_name_encrypted = public.encrypt_pii(p_contact_name),
        contact_email_encrypted = public.encrypt_pii(p_contact_email),
        feedback = p_feedback,
        completed_at = now(),
        updated_at = now()
    WHERE id = p_response_id;

    -- Auto-close the survey if the max respondents cap has been reached.
    SELECT max_respondents
      INTO v_max
      FROM surveys
     WHERE id = v_survey_id;

    IF v_max IS NOT NULL THEN
        SELECT count(*)
          INTO v_completed
          FROM survey_responses
         WHERE survey_id = v_survey_id
           AND status = 'completed';

        IF v_completed >= v_max THEN
            UPDATE surveys
            SET status = 'closed',
                updated_at = now()
            WHERE id = v_survey_id
              AND status = 'active';
        END IF;
    END IF;
END;
$$;

-- 2. Add surveys table to Realtime publication so the dashboard can detect
--    status changes (auto-close, manual close, etc.) in real time.
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."surveys";
