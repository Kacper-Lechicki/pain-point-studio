-- Security hardening migration
-- 1. Restrict SECURITY DEFINER function grants (revoke anon access from sensitive functions)
-- 2. Encrypt PII fields in survey_responses
-- 3. Add safer JSON type coercion in validate_and_save_answer

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Revoke anon access from sensitive SECURITY DEFINER functions
-- ═══════════════════════════════════════════════════════════════════════

-- cancel_email_change: only authenticated users should cancel their own email changes
REVOKE ALL ON FUNCTION public.cancel_email_change() FROM anon;

-- verify_password: only authenticated users should verify their own password
REVOKE ALL ON FUNCTION public.verify_password(text) FROM anon;

-- has_password: only authenticated users should check their own password status
REVOKE ALL ON FUNCTION public.has_password() FROM anon;

-- get_email_change_status: only authenticated users should check their own email change
REVOKE ALL ON FUNCTION public.get_email_change_status() FROM anon;

-- get_survey_stats_data: requires p_user_id, only makes sense for authenticated users
REVOKE ALL ON FUNCTION public.get_survey_stats_data(uuid, uuid) FROM anon;

-- get_user_surveys_with_counts: requires p_user_id, only for authenticated users
REVOKE ALL ON FUNCTION public.get_user_surveys_with_counts(uuid) FROM anon;

-- save_survey_questions: requires ownership check, only for authenticated users
REVOKE ALL ON FUNCTION public.save_survey_questions(uuid, uuid, jsonb) FROM anon;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Add pgcrypto-based encryption helpers for PII in survey_responses
-- ═══════════════════════════════════════════════════════════════════════

-- Create an encryption key in Supabase Vault for PII encryption.
-- In production, rotate this key and manage via Supabase Vault UI.
-- The key is stored securely in vault.secrets (not in plain SQL).
SELECT vault.create_secret(
  extensions.gen_random_bytes(32)::text,
  'pii_encryption_key',
  'Symmetric key for encrypting PII fields in survey_responses'
);

-- Helper: encrypt text using the vault key
CREATE OR REPLACE FUNCTION public.encrypt_pii(plain_text text)
RETURNS bytea
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_key text;
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key'
  LIMIT 1;

  RETURN extensions.pgp_sym_encrypt(plain_text, v_key);
END;
$$;

-- Helper: decrypt text using the vault key
CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted bytea)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_key text;
BEGIN
  IF encrypted IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key'
  LIMIT 1;

  RETURN extensions.pgp_sym_decrypt(encrypted, v_key);
END;
$$;

-- Only authenticated & service_role can use PII helpers (not anon)
REVOKE ALL ON FUNCTION public.encrypt_pii(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.encrypt_pii(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_pii(text) TO service_role;

REVOKE ALL ON FUNCTION public.decrypt_pii(bytea) FROM anon;
GRANT EXECUTE ON FUNCTION public.decrypt_pii(bytea) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_pii(bytea) TO service_role;

-- Add encrypted columns alongside existing plain text columns
ALTER TABLE public.survey_responses
  ADD COLUMN IF NOT EXISTS contact_name_encrypted bytea,
  ADD COLUMN IF NOT EXISTS contact_email_encrypted bytea;

-- Migrate existing data to encrypted columns
UPDATE public.survey_responses
SET
  contact_name_encrypted = public.encrypt_pii(contact_name),
  contact_email_encrypted = public.encrypt_pii(contact_email)
WHERE contact_name IS NOT NULL OR contact_email IS NOT NULL;

-- Update submit_survey_response to encrypt PII on insert
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
    v_missing_count int;
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

    SELECT COUNT(*)
      INTO v_missing_count
      FROM survey_questions q
     WHERE q.survey_id = v_survey_id
       AND q.required = true
       AND NOT EXISTS (
           SELECT 1
           FROM survey_answers a
           WHERE a.response_id = p_response_id
             AND a.question_id = q.id
             AND a.value IS NOT NULL
             AND a.value != '{}'::jsonb
       );

    IF v_missing_count > 0 THEN
        RAISE EXCEPTION 'REQUIRED_QUESTIONS_UNANSWERED';
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

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Safer JSON type coercion in validate_and_save_answer
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.validate_and_save_answer(
  p_response_id uuid,
  p_question_id uuid,
  p_value jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_question_type question_type;
    v_question_config jsonb;
    v_question_survey_id uuid;
    v_response_survey_id uuid;
    v_response_status text;
    v_rating int;
    v_text_value text;
    v_selected jsonb;
    v_max_length int;
    v_min_rating int;
    v_max_rating int;
    v_min_selections int;
    v_max_selections int;
BEGIN
    -- 1. Verify response exists and is in_progress
    SELECT survey_id, status
      INTO v_response_survey_id, v_response_status
      FROM survey_responses
     WHERE id = p_response_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_response_status != 'in_progress' THEN
        RAISE EXCEPTION 'RESPONSE_ALREADY_COMPLETED';
    END IF;

    -- 2. Get question metadata
    SELECT type, config, survey_id
      INTO v_question_type, v_question_config, v_question_survey_id
      FROM survey_questions
     WHERE id = p_question_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND';
    END IF;

    -- 3. Cross-survey ownership check
    IF v_question_survey_id != v_response_survey_id THEN
        RAISE EXCEPTION 'QUESTION_SURVEY_MISMATCH';
    END IF;

    -- 4. Type-specific validation (with safe coercion)
    CASE v_question_type
        WHEN 'rating_scale' THEN
            BEGIN
                v_rating := (p_value->>'rating')::int;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'RATING_INVALID_FORMAT';
            END;

            IF v_rating IS NULL THEN
                RAISE EXCEPTION 'RATING_REQUIRED';
            END IF;

            BEGIN
                v_min_rating := COALESCE((v_question_config->>'min')::int, 1);
                v_max_rating := COALESCE((v_question_config->>'max')::int, 5);
            EXCEPTION WHEN OTHERS THEN
                v_min_rating := 1;
                v_max_rating := 5;
            END;

            IF v_rating < v_min_rating OR v_rating > v_max_rating THEN
                RAISE EXCEPTION 'RATING_OUT_OF_BOUNDS';
            END IF;

        WHEN 'multiple_choice' THEN
            v_selected := p_value->'selected';

            IF v_selected IS NULL OR jsonb_typeof(v_selected) != 'array' THEN
                RAISE EXCEPTION 'SELECTED_MUST_BE_ARRAY';
            END IF;

            BEGIN
                v_max_selections := (v_question_config->>'maxSelections')::int;
                v_min_selections := (v_question_config->>'minSelections')::int;
            EXCEPTION WHEN OTHERS THEN
                v_max_selections := NULL;
                v_min_selections := NULL;
            END;

            IF v_max_selections IS NOT NULL AND jsonb_array_length(v_selected) > v_max_selections THEN
                RAISE EXCEPTION 'MAX_SELECTIONS_EXCEEDED';
            END IF;

            IF v_min_selections IS NOT NULL AND jsonb_array_length(v_selected) < v_min_selections THEN
                RAISE EXCEPTION 'MIN_SELECTIONS_NOT_MET';
            END IF;

            IF NOT COALESCE((v_question_config->>'allowOther')::boolean, false) THEN
                IF EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements_text(v_selected) AS sel
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements_text(v_question_config->'options') AS opt
                        WHERE opt = sel
                    )
                ) THEN
                    RAISE EXCEPTION 'INVALID_OPTION_SELECTED';
                END IF;
            END IF;

        WHEN 'yes_no' THEN
            IF p_value->>'answer' IS NULL
               OR (p_value->>'answer' != 'true' AND p_value->>'answer' != 'false') THEN
                RAISE EXCEPTION 'YES_NO_INVALID';
            END IF;

        WHEN 'open_text', 'short_text' THEN
            v_text_value := p_value->>'text';

            IF v_text_value IS NOT NULL THEN
                BEGIN
                    v_max_length := (v_question_config->>'maxLength')::int;
                EXCEPTION WHEN OTHERS THEN
                    v_max_length := NULL;
                END;

                IF v_max_length IS NOT NULL AND char_length(v_text_value) > v_max_length THEN
                    RAISE EXCEPTION 'TEXT_TOO_LONG';
                END IF;
            END IF;
    END CASE;

    -- 5. Upsert the validated answer
    INSERT INTO survey_answers (response_id, question_id, value)
    VALUES (p_response_id, p_question_id, p_value)
    ON CONFLICT (response_id, question_id)
    DO UPDATE SET value = EXCLUDED.value,
                  updated_at = now();
END;
$$;
