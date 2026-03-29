-- Simplify status machines: remove archived/cancelled/reopen/archive/restore
-- Projects: active, completed, trashed
-- Surveys: draft, active, completed, trashed

BEGIN;

-- ============================================================
-- 1. MIGRATE PROJECT DATA
-- ============================================================

-- Archived projects → completed
UPDATE public.projects
   SET status = 'completed',
       completed_at = COALESCE(archived_at, now())
 WHERE status = 'archived';

-- Fix pre_trash_status references to removed statuses
UPDATE public.projects
   SET pre_trash_status = 'completed'
 WHERE pre_trash_status = 'archived';

-- ============================================================
-- 2. MIGRATE SURVEY DATA
-- ============================================================

-- Cancelled surveys → completed
UPDATE public.surveys
   SET status = 'completed'::public.survey_status,
       completed_at = COALESCE(cancelled_at, now())
 WHERE status = 'cancelled'::public.survey_status;

-- Archived surveys → completed
UPDATE public.surveys
   SET status = 'completed'::public.survey_status,
       completed_at = COALESCE(archived_at, now())
 WHERE status = 'archived'::public.survey_status;

-- Fix pre_trash_status references to removed statuses
UPDATE public.surveys
   SET pre_trash_status = 'completed'
 WHERE pre_trash_status IN ('cancelled', 'archived');

-- ============================================================
-- 3. DROP RLS POLICIES (they depend on cancelled_at column or survey_status enum)
-- ============================================================

DROP POLICY IF EXISTS "select_surveys" ON public.surveys;
DROP POLICY IF EXISTS "select_survey_questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Anyone can create response for active survey" ON public.survey_responses;

-- ============================================================
-- 4. DROP OBSOLETE COLUMNS (now safe — policies recreated without cancelled_at)
-- ============================================================

ALTER TABLE public.projects
  DROP COLUMN IF EXISTS pre_archive_status,
  DROP COLUMN IF EXISTS archived_at;

ALTER TABLE public.surveys
  DROP COLUMN IF EXISTS previous_status,
  DROP COLUMN IF EXISTS cancelled_at,
  DROP COLUMN IF EXISTS archived_at;

-- ============================================================
-- 5. UPDATE PROJECT CHECK CONSTRAINTS
-- ============================================================

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_pre_archive_status_check;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'trashed'::text]));

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_pre_trash_status_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_pre_trash_status_check
  CHECK (pre_trash_status IS NULL OR pre_trash_status = ANY (ARRAY['active'::text, 'completed'::text]));

-- ============================================================
-- 5. RECREATE SURVEY_STATUS ENUM (Postgres cannot DROP VALUE)
-- ============================================================

-- Drop CHECK constraints that reference the old enum before ALTER TYPE
ALTER TABLE public.surveys
  DROP CONSTRAINT IF EXISTS surveys_chk_completed_has_timestamp;

CREATE TYPE public.survey_status_new AS ENUM ('draft', 'active', 'completed', 'trashed');

-- surveys.status column
ALTER TABLE public.surveys
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.surveys
  ALTER COLUMN status TYPE public.survey_status_new
  USING status::text::public.survey_status_new;

ALTER TABLE public.surveys
  ALTER COLUMN status SET DEFAULT 'draft'::public.survey_status_new;

-- Drop old enum, rename new
DROP TYPE public.survey_status;
ALTER TYPE public.survey_status_new RENAME TO survey_status;

-- Recreate surveys_chk_completed_has_timestamp with new enum
ALTER TABLE public.surveys
  DROP CONSTRAINT IF EXISTS surveys_chk_completed_has_timestamp;

ALTER TABLE public.surveys
  ADD CONSTRAINT surveys_chk_completed_has_timestamp
  CHECK (status <> 'completed'::public.survey_status OR completed_at IS NOT NULL);

-- Update surveys pre_trash_status CHECK
ALTER TABLE public.surveys
  DROP CONSTRAINT IF EXISTS surveys_pre_trash_status_check;

ALTER TABLE public.surveys
  ADD CONSTRAINT surveys_pre_trash_status_check
  CHECK (pre_trash_status IS NULL OR pre_trash_status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text]));

-- ============================================================
-- 7. RECREATE RLS POLICIES (with new enum, without cancelled branch)
-- ============================================================

CREATE POLICY "select_surveys" ON public.surveys
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR (
      slug IS NOT NULL
      AND (
        status = 'active'::public.survey_status
        OR (
          status = 'completed'::public.survey_status
          AND completed_at IS NOT NULL
          AND completed_at > now() - interval '30 days'
        )
      )
    )
  );

CREATE POLICY "select_survey_questions" ON public.survey_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.surveys
       WHERE surveys.id = survey_questions.survey_id
         AND (
           surveys.user_id = (SELECT auth.uid())
           OR (
             surveys.slug IS NOT NULL
             AND (
               surveys.status = 'active'::public.survey_status
               OR (
                 surveys.status = 'completed'::public.survey_status
                 AND surveys.completed_at IS NOT NULL
                 AND surveys.completed_at > now() - interval '30 days'
               )
             )
           )
         )
    )
  );

CREATE POLICY "Anyone can create response for active survey" ON public.survey_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.surveys
       WHERE surveys.id = survey_responses.survey_id
         AND surveys.status = 'active'::public.survey_status
         AND surveys.slug IS NOT NULL
    )
  );

-- ============================================================
-- 8. FIX survey listing RPCs (remove references to dropped columns)
-- ============================================================

-- Fix get_project_surveys_with_counts: remove archivedAt, cancelledAt, previousStatus
CREATE OR REPLACE FUNCTION "public"."get_project_surveys_with_counts"("p_user_id" "uuid", "p_project_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'title', s.title,
                'description', s.description,
                'status', s.status,
                'slug', s.slug,
                'viewCount', s.view_count,
                'responseCount', COALESCE(rc.cnt, 0),
                'completedCount', COALESCE(cc.cnt, 0),
                'questionCount', COALESCE(qc.cnt, 0),
                'recentActivity', COALESCE(ra.daily, '[]'::jsonb),
                'lastResponseAt', lr.last_at,
                'startsAt', s.starts_at,
                'endsAt', s.ends_at,
                'maxRespondents', s.max_respondents,
                'completedAt', s.completed_at,
                'createdAt', s.created_at,
                'updatedAt', s.updated_at,
                'avgCompletionSeconds', ct.avg_secs,
                'avgQuestionCompletion', aqc.avg_pct,
                'projectId', s.project_id,
                'projectName', p.name,
                'researchPhase', s.research_phase,
                'deletedAt', s.deleted_at,
                'preTrashStatus', s.pre_trash_status
            ) ORDER BY s.updated_at DESC
        )
        FROM public.surveys s
        LEFT JOIN public.projects p ON p.id = s.project_id
        LEFT JOIN (SELECT survey_id, count(*) AS cnt FROM public.survey_responses GROUP BY survey_id) rc ON rc.survey_id = s.id
        LEFT JOIN (SELECT survey_id, count(*) AS cnt FROM public.survey_responses WHERE status = 'completed' GROUP BY survey_id) cc ON cc.survey_id = s.id
        LEFT JOIN (SELECT survey_id, count(*) AS cnt FROM public.survey_questions GROUP BY survey_id) qc ON qc.survey_id = s.id
        LEFT JOIN (SELECT survey_id, max(completed_at) AS last_at FROM public.survey_responses WHERE status = 'completed' AND completed_at IS NOT NULL GROUP BY survey_id) lr ON lr.survey_id = s.id
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(day_count ORDER BY day) AS daily FROM (
                SELECT d.day, COALESCE(cnt.c, 0) AS day_count
                FROM generate_series((current_date - interval '13 days')::date, current_date, interval '1 day') AS d(day)
                LEFT JOIN (SELECT created_at::date AS rday, count(*) AS c FROM public.survey_responses WHERE survey_id = s.id AND status = 'completed' AND created_at >= (current_date - interval '13 days') GROUP BY created_at::date) cnt ON cnt.rday = d.day
            ) sub
        ) ra ON true
        LEFT JOIN (SELECT survey_id, round(avg(extract(epoch FROM (completed_at - started_at))))::int AS avg_secs FROM public.survey_responses WHERE status = 'completed' AND completed_at IS NOT NULL AND started_at IS NOT NULL GROUP BY survey_id) ct ON ct.survey_id = s.id
        LEFT JOIN LATERAL (SELECT count(*) AS total_answers FROM public.survey_answers a JOIN public.survey_responses r ON r.id = a.response_id WHERE r.survey_id = s.id AND r.status = 'completed') ac ON true
        LEFT JOIN LATERAL (SELECT CASE WHEN COALESCE(cc.cnt, 0) = 0 OR COALESCE(qc.cnt, 0) = 0 THEN NULL ELSE round(COALESCE(ac.total_answers, 0)::numeric / (COALESCE(cc.cnt, 0) * COALESCE(qc.cnt, 0)) * 100)::int END AS avg_pct) aqc ON true
        WHERE s.user_id = p_user_id AND s.project_id = p_project_id
    ), '[]'::jsonb);
END;
$$;

-- Fix get_user_surveys_with_counts: remove archivedAt, cancelledAt, previousStatus
CREATE OR REPLACE FUNCTION "public"."get_user_surveys_with_counts"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'title', s.title,
                'description', s.description,
                'status', s.status,
                'slug', s.slug,
                'viewCount', s.view_count,
                'responseCount', COALESCE(rc.cnt, 0),
                'completedCount', COALESCE(cc.cnt, 0),
                'questionCount', COALESCE(qc.cnt, 0),
                'recentActivity', COALESCE(ra.daily, '[]'::jsonb),
                'lastResponseAt', lr.last_at,
                'startsAt', s.starts_at,
                'endsAt', s.ends_at,
                'maxRespondents', s.max_respondents,
                'completedAt', s.completed_at,
                'createdAt', s.created_at,
                'updatedAt', s.updated_at,
                'avgCompletionSeconds', ct.avg_secs,
                'avgQuestionCompletion', aqc.avg_pct,
                'projectId', s.project_id,
                'researchPhase', s.research_phase,
                'projectName', p.name,
                'deletedAt', s.deleted_at,
                'preTrashStatus', s.pre_trash_status
            ) ORDER BY s.updated_at DESC
        )
        FROM public.surveys s
        LEFT JOIN public.projects p ON p.id = s.project_id
        LEFT JOIN (SELECT survey_id, count(*) AS cnt FROM public.survey_responses GROUP BY survey_id) rc ON rc.survey_id = s.id
        LEFT JOIN (SELECT survey_id, count(*) AS cnt FROM public.survey_responses WHERE status = 'completed' GROUP BY survey_id) cc ON cc.survey_id = s.id
        LEFT JOIN (SELECT survey_id, count(*) AS cnt FROM public.survey_questions GROUP BY survey_id) qc ON qc.survey_id = s.id
        LEFT JOIN (SELECT survey_id, max(completed_at) AS last_at FROM public.survey_responses WHERE status = 'completed' AND completed_at IS NOT NULL GROUP BY survey_id) lr ON lr.survey_id = s.id
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(day_count ORDER BY day) AS daily FROM (
                SELECT d.day, COALESCE(cnt.c, 0) AS day_count
                FROM generate_series((current_date - interval '13 days')::date, current_date, interval '1 day') AS d(day)
                LEFT JOIN (SELECT created_at::date AS rday, count(*) AS c FROM public.survey_responses WHERE survey_id = s.id AND status = 'completed' AND created_at >= (current_date - interval '13 days') GROUP BY created_at::date) cnt ON cnt.rday = d.day
            ) sub
        ) ra ON true
        LEFT JOIN (SELECT survey_id, round(avg(extract(epoch FROM (completed_at - started_at))))::int AS avg_secs FROM public.survey_responses WHERE status = 'completed' AND completed_at IS NOT NULL AND started_at IS NOT NULL GROUP BY survey_id) ct ON ct.survey_id = s.id
        LEFT JOIN LATERAL (SELECT count(*) AS total_answers FROM public.survey_answers a JOIN public.survey_responses r ON r.id = a.response_id WHERE r.survey_id = s.id AND r.status = 'completed') ac ON true
        LEFT JOIN LATERAL (SELECT CASE WHEN COALESCE(cc.cnt, 0) = 0 OR COALESCE(qc.cnt, 0) = 0 THEN NULL ELSE round(COALESCE(ac.total_answers, 0)::numeric / (COALESCE(cc.cnt, 0) * COALESCE(qc.cnt, 0)) * 100)::int END AS avg_pct) aqc ON true
        WHERE s.user_id = p_user_id
    ), '[]'::jsonb);
END;
$$;

-- ============================================================
-- 9. REPLACE RPC: change_project_status_with_cascade
--    Only 3 actions: complete, trash, restoreTrash
-- ============================================================

CREATE OR REPLACE FUNCTION public.change_project_status_with_cascade(
  p_project_id uuid,
  p_user_id uuid,
  p_action text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_project RECORD;
  v_now TIMESTAMPTZ := now();
  v_new_status TEXT;
  v_project_name TEXT;
  v_base_name TEXT;
  v_suffix INT;
BEGIN
  -- 1. Fetch and lock the project
  SELECT status, pre_trash_status, name
    INTO v_project
    FROM public.projects
   WHERE id = p_project_id
     AND user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'projects.errors.unexpected');
  END IF;

  -- 2. Validate transition
  CASE p_action
    WHEN 'complete' THEN
      IF v_project.status != 'active' THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;

    WHEN 'trash' THEN
      IF v_project.status NOT IN ('active', 'completed') THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;

    WHEN 'restoreTrash' THEN
      IF v_project.status != 'trashed' THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;

    ELSE
      RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
  END CASE;

  -- 3. Execute action
  CASE p_action
    WHEN 'complete' THEN
      UPDATE public.projects
         SET status = 'completed', completed_at = v_now
       WHERE id = p_project_id;

      -- Cascade: complete active surveys
      UPDATE public.surveys
         SET status = 'completed'::public.survey_status,
             completed_at = v_now,
             updated_at = v_now
       WHERE project_id = p_project_id
         AND status = 'active'::public.survey_status;

    WHEN 'trash' THEN
      -- First: complete any active surveys (irreversible)
      UPDATE public.surveys
         SET status = 'completed'::public.survey_status,
             completed_at = v_now,
             updated_at = v_now
       WHERE project_id = p_project_id
         AND status = 'active'::public.survey_status;

      -- Save pre_trash_status and trash the project
      UPDATE public.projects
         SET status = 'trashed',
             deleted_at = v_now,
             pre_trash_status = v_project.status
       WHERE id = p_project_id;

      -- Cascade: trash all non-trashed surveys (save their pre_trash_status)
      UPDATE public.surveys
         SET pre_trash_status = status::text,
             status = 'trashed'::public.survey_status,
             deleted_at = v_now
       WHERE project_id = p_project_id
         AND status != 'trashed'::public.survey_status;

    WHEN 'restoreTrash' THEN
      v_new_status := COALESCE(v_project.pre_trash_status, 'active');

      -- Resolve name: strip existing suffix, use base name if no conflict
      v_base_name := regexp_replace(v_project.name, '\s*\(restored #\d+\)$', '');
      v_project_name := v_base_name;

      IF EXISTS(
        SELECT 1 FROM public.projects
         WHERE user_id = p_user_id
           AND id != p_project_id
           AND lower(name) = lower(v_project_name)
           AND status != 'trashed'
      ) THEN
        v_suffix := 1;
        v_project_name := v_base_name || ' (restored #1)';

        WHILE EXISTS(
          SELECT 1 FROM public.projects
           WHERE user_id = p_user_id
             AND id != p_project_id
             AND lower(name) = lower(v_project_name)
             AND status != 'trashed'
        ) LOOP
          v_suffix := v_suffix + 1;
          v_project_name := v_base_name || ' (restored #' || v_suffix || ')';
        END LOOP;
      END IF;

      UPDATE public.projects
         SET status = v_new_status,
             deleted_at = NULL,
             pre_trash_status = NULL,
             name = v_project_name
       WHERE id = p_project_id;

      -- Cascade: restore trashed surveys to their pre_trash_status
      UPDATE public.surveys
         SET status = COALESCE(pre_trash_status, 'draft')::public.survey_status,
             deleted_at = NULL,
             pre_trash_status = NULL
       WHERE project_id = p_project_id
         AND status = 'trashed'::public.survey_status;
  END CASE;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 9. FIX get_project_response_count (referenced 'archived' enum value)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_project_response_count(p_project_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT coalesce(count(*)::integer, 0)
    FROM public.survey_responses sr
    JOIN public.surveys s ON s.id = sr.survey_id
   WHERE s.project_id = p_project_id
     AND s.status != 'trashed'::public.survey_status
     AND sr.status = 'completed'
     AND sr.submitted_after_close = false;
$$;

-- ============================================================
-- 10. FIX get_recent_items RPC (referenced 'cancelled' enum value)
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."get_recent_items"(
    "p_item_type" "text",
    "p_limit" integer DEFAULT 5,
    "p_project_id" "uuid" DEFAULT NULL
) RETURNS "jsonb"
    LANGUAGE "sql"
    STABLE
    SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT COALESCE(
        jsonb_agg(to_jsonb(r) ORDER BY r.visited_at DESC),
        '[]'::jsonb
    )
    FROM (
        SELECT
            ri.item_id AS id,
            CASE ri.item_type
                WHEN 'project' THEN p.name
                WHEN 'survey' THEN s.title
            END AS label,
            CASE ri.item_type
                WHEN 'project' THEN p.image_url
                ELSE NULL
            END AS "imageUrl",
            ri.item_type AS type,
            ri.visited_at
        FROM public.user_recent_items ri
        LEFT JOIN public.projects p
            ON ri.item_type = 'project' AND p.id = ri.item_id
        LEFT JOIN public.surveys s
            ON ri.item_type = 'survey' AND s.id = ri.item_id
        WHERE ri.user_id = auth.uid()
            AND ri.item_type = p_item_type
            AND (
                (ri.item_type = 'project' AND p.id IS NOT NULL AND p.status != 'trashed')
                OR (ri.item_type = 'survey' AND s.id IS NOT NULL AND s.status != 'trashed'::public.survey_status)
            )
            AND (p_project_id IS NULL OR s.project_id = p_project_id)
        ORDER BY ri.visited_at DESC
        LIMIT p_limit
    ) r;
$$;

COMMIT;
