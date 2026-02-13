-- Allow fully empty survey responses: user can skip all questions and still submit.
-- Response is marked completed (1 participant), no answers saved → 0% response rate.

CREATE OR REPLACE FUNCTION public.submit_survey_response(
  p_response_id uuid,
  p_contact_name text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_feedback text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_survey_id uuid;
    v_status text;
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

    UPDATE survey_responses
    SET status = 'completed',
        contact_name = p_contact_name,
        contact_email = p_contact_email,
        contact_name_encrypted = public.encrypt_pii(p_contact_name),
        contact_email_encrypted = public.encrypt_pii(p_contact_email),
        feedback = p_feedback,
        completed_at = now(),
        updated_at = now()
    WHERE id = p_response_id;
END;
$$;
