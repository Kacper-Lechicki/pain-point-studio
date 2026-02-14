-- Remove plain-text PII columns from survey_responses.
-- Encrypted equivalents (contact_name_encrypted, contact_email_encrypted)
-- were added in 20260212103154_security_hardening.sql and are already populated.
-- The submit_survey_response RPC is updated to only write encrypted PII.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Update submit_survey_response to stop writing plain-text PII
-- ═══════════════════════════════════════════════════════════════════════

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
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Clear existing plain-text PII data
-- ═══════════════════════════════════════════════════════════════════════

UPDATE public.survey_responses
SET contact_name = NULL,
    contact_email = NULL
WHERE contact_name IS NOT NULL OR contact_email IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Drop the plain-text PII columns
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.survey_responses
  DROP COLUMN IF EXISTS contact_name,
  DROP COLUMN IF EXISTS contact_email;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Create export RPC that decrypts PII for survey owner
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_export_responses(
  p_survey_id uuid,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  completed_at timestamptz,
  contact_name text,
  contact_email text,
  feedback text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Verify the caller owns this survey
  IF NOT EXISTS (
    SELECT 1 FROM public.surveys
    WHERE surveys.id = p_survey_id AND surveys.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  RETURN QUERY
  SELECT
    sr.id,
    sr.completed_at,
    public.decrypt_pii(sr.contact_name_encrypted) AS contact_name,
    public.decrypt_pii(sr.contact_email_encrypted) AS contact_email,
    sr.feedback
  FROM public.survey_responses sr
  WHERE sr.survey_id = p_survey_id AND sr.status = 'completed'
  ORDER BY sr.completed_at;
END;
$$;

-- Only authenticated users can export (they need to own the survey)
REVOKE ALL ON FUNCTION public.get_export_responses(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_export_responses(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_export_responses(uuid, uuid) TO service_role;
