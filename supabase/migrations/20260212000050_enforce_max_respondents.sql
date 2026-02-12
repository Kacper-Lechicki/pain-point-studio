-- Atomic function to start a survey response while enforcing max_respondents.
-- Uses a row-level lock on the survey to prevent race conditions.

CREATE OR REPLACE FUNCTION public.start_survey_response(p_survey_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max integer;
  v_current integer;
  v_status text;
  v_response_id uuid;
BEGIN
  -- Lock the survey row to prevent concurrent inserts from exceeding the limit
  SELECT status, max_respondents
    INTO v_status, v_max
    FROM surveys
   WHERE id = p_survey_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SURVEY_NOT_FOUND';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
  END IF;

  IF v_max IS NOT NULL THEN
    SELECT count(*)
      INTO v_current
      FROM survey_responses
     WHERE survey_id = p_survey_id
       AND status IN ('in_progress', 'completed');

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'MAX_RESPONDENTS_REACHED';
    END IF;
  END IF;

  INSERT INTO survey_responses (survey_id)
  VALUES (p_survey_id)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;

-- Allow anonymous users to call the function (respondents are not authenticated)
GRANT EXECUTE ON FUNCTION public.start_survey_response(uuid) TO anon;
