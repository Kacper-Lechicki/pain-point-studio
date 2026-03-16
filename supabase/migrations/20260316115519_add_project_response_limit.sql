-- ── 1. Rename column target_responses → response_limit ─────────────
ALTER TABLE public.projects RENAME COLUMN target_responses TO response_limit;

-- ── 2. Update default to 50 (plan limit) ──────────────────────────
ALTER TABLE public.projects ALTER COLUMN response_limit SET DEFAULT 50;

-- ── 3. Replace check constraint ───────────────────────────────────
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_target_responses_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_response_limit_check CHECK (response_limit >= 1);

-- ── 4. Backfill existing projects to 50 ───────────────────────────
UPDATE public.projects SET response_limit = 50 WHERE response_limit IS DISTINCT FROM 50;

-- ── 5. Helper: count completed responses for a project ────────────
-- Counts completed responses from surveys NOT in archived/trashed status.
CREATE OR REPLACE FUNCTION public.get_project_response_count(p_project_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT coalesce(count(*)::integer, 0)
    FROM public.survey_responses sr
    JOIN public.surveys s ON s.id = sr.survey_id
   WHERE s.project_id = p_project_id
     AND s.status NOT IN ('archived', 'trashed')
     AND sr.status = 'completed'
     AND sr.submitted_after_close = false;
$$;

ALTER FUNCTION public.get_project_response_count(uuid) OWNER TO postgres;

-- ── 6. Helper: remaining capacity for a project ──────────────────
CREATE OR REPLACE FUNCTION public.get_project_remaining_capacity(p_project_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT GREATEST(
    (SELECT response_limit FROM public.projects WHERE id = p_project_id) -
    public.get_project_response_count(p_project_id),
    0
  );
$$;

ALTER FUNCTION public.get_project_remaining_capacity(uuid) OWNER TO postgres;

-- ── 7. Update start_survey_response (2-arg) — add project limit check
CREATE OR REPLACE FUNCTION public.start_survey_response(
  p_survey_id uuid,
  p_device_type text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_max integer;
  v_current integer;
  v_status text;
  v_project_id uuid;
  v_response_id uuid;
BEGIN
  SELECT status, max_respondents, project_id
    INTO v_status, v_max, v_project_id
    FROM public.surveys
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
      FROM public.survey_responses
     WHERE survey_id = p_survey_id
       AND (
         status = 'completed'
         OR (status = 'in_progress' AND started_at > now() - interval '24 hours')
       );

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'MAX_RESPONDENTS_REACHED';
    END IF;
  END IF;

  -- Project-level response limit check
  IF v_project_id IS NOT NULL THEN
    IF public.get_project_remaining_capacity(v_project_id) <= 0 THEN
      RAISE EXCEPTION 'PROJECT_LIMIT_REACHED';
    END IF;
  END IF;

  INSERT INTO public.survey_responses (survey_id, device_type)
  VALUES (p_survey_id, p_device_type)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;

ALTER FUNCTION public.start_survey_response(uuid, text) OWNER TO postgres;

-- ── 8. Update start_survey_response (3-arg) — add project limit check
CREATE OR REPLACE FUNCTION public.start_survey_response(
  p_survey_id uuid,
  p_device_type text DEFAULT NULL,
  p_fingerprint text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_max integer;
  v_current integer;
  v_status text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_project_id uuid;
  v_response_id uuid;
  v_existing_count integer;
BEGIN
  SELECT status, max_respondents, starts_at, ends_at, project_id
    INTO v_status, v_max, v_starts_at, v_ends_at, v_project_id
    FROM public.surveys
   WHERE id = p_survey_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SURVEY_NOT_FOUND';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
  END IF;

  IF v_starts_at IS NOT NULL AND v_starts_at > now() THEN
    RAISE EXCEPTION 'SURVEY_NOT_STARTED';
  END IF;

  IF v_ends_at IS NOT NULL AND v_ends_at < now() THEN
    RAISE EXCEPTION 'SURVEY_EXPIRED';
  END IF;

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

  -- Project-level response limit check
  IF v_project_id IS NOT NULL THEN
    IF public.get_project_remaining_capacity(v_project_id) <= 0 THEN
      RAISE EXCEPTION 'PROJECT_LIMIT_REACHED';
    END IF;
  END IF;

  INSERT INTO public.survey_responses (survey_id, device_type, fingerprint)
  VALUES (p_survey_id, p_device_type, p_fingerprint)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;

ALTER FUNCTION public.start_survey_response(uuid, text, text) OWNER TO postgres;

-- ── 9. Update submit_survey_response — auto-complete when project limit reached
CREATE OR REPLACE FUNCTION public.submit_survey_response(
  p_response_id uuid,
  p_contact_name text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_feedback text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_survey_id uuid;
    v_status text;
    v_survey_status text;
    v_max integer;
    v_completed integer;
    v_ends_at timestamptz;
    v_is_late boolean := false;
    v_project_id uuid;
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

    SELECT status, ends_at, project_id
      INTO v_survey_status, v_ends_at, v_project_id
      FROM public.surveys
     WHERE id = v_survey_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SURVEY_NOT_FOUND';
    END IF;

    IF v_survey_status <> 'active' THEN
        RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
    END IF;

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

    IF NOT v_is_late THEN
        -- Per-survey max_respondents auto-complete
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

        -- Project-level response limit: auto-complete ALL active surveys
        IF v_project_id IS NOT NULL THEN
            IF public.get_project_remaining_capacity(v_project_id) <= 0 THEN
                UPDATE public.surveys
                SET status = 'completed',
                    completed_at = now(),
                    updated_at = now()
                WHERE project_id = v_project_id
                  AND status = 'active';
            END IF;
        END IF;
    END IF;
END;
$$;

ALTER FUNCTION public.submit_survey_response(uuid, text, text, text) OWNER TO postgres;

-- ── 10. Add explicit user_id index for RLS performance on user_recent_items ──
CREATE INDEX IF NOT EXISTS "user_recent_items_user_id_idx"
    ON "public"."user_recent_items" ("user_id");
