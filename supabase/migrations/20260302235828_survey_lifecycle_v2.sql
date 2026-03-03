-- =============================================================================
-- Migration: survey_lifecycle_v2
-- Description: Unify survey lifecycle with projects:
--   - Add 'trashed' status to surveys (soft delete with 30-day auto-purge)
--   - Add deleted_at, pre_trash_status columns to surveys
--   - Fix FK on surveys.project_id: SET NULL → CASCADE
--   - Add pre_archive_status to projects (for correct restore target)
--   - Create purge_trashed_surveys() function for cron
--   - Update RPCs to include new fields
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXPAND survey_status ENUM
-- -----------------------------------------------------------------------------

ALTER TYPE "public"."survey_status" ADD VALUE IF NOT EXISTS 'trashed';

-- -----------------------------------------------------------------------------
-- 2. ADD NEW COLUMNS TO SURVEYS
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."surveys"
    ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz,
    ADD COLUMN IF NOT EXISTS "pre_trash_status" text;

COMMENT ON COLUMN "public"."surveys"."deleted_at"
    IS 'When the survey was soft-deleted (trashed). Auto-purged after 30 days.';
COMMENT ON COLUMN "public"."surveys"."pre_trash_status"
    IS 'The status before trashing, used to restore to the correct state.';

-- pre_trash_status can only be a non-trash status (or NULL)
ALTER TABLE "public"."surveys" ADD CONSTRAINT "surveys_pre_trash_status_check"
    CHECK ("pre_trash_status" IS NULL OR "pre_trash_status" = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'cancelled'::text, 'archived'::text]));

-- -----------------------------------------------------------------------------
-- 3. ADD INDEX FOR CRON PURGE
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "surveys_deleted_at_idx"
    ON "public"."surveys" USING btree ("deleted_at")
    WHERE "deleted_at" IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. FIX FK: SET NULL → CASCADE
-- -----------------------------------------------------------------------------
-- The old FK was ON DELETE SET NULL, but project_id is NOT NULL — this caused
-- permanent project delete to fail silently. CASCADE is correct: when a project
-- is hard-deleted, its surveys should be deleted too.
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."surveys" DROP CONSTRAINT IF EXISTS "surveys_project_id_fkey";
ALTER TABLE "public"."surveys"
    ADD CONSTRAINT "surveys_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 5. ADD pre_archive_status TO PROJECTS
-- -----------------------------------------------------------------------------
-- Tracks the status before archiving so restore goes back to the correct state
-- (e.g. completed → archived → completed, not hardcoded to active).
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."projects"
    ADD COLUMN IF NOT EXISTS "pre_archive_status" text;

COMMENT ON COLUMN "public"."projects"."pre_archive_status"
    IS 'The status before archiving, used to restore to the correct state.';

ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_pre_archive_status_check"
    CHECK ("pre_archive_status" IS NULL OR "pre_archive_status" = ANY (ARRAY['active'::text, 'completed'::text]));

-- -----------------------------------------------------------------------------
-- 6. CREATE PURGE FUNCTION FOR SURVEYS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."purge_trashed_surveys"()
RETURNS void
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO ''
AS $$
BEGIN
    DELETE FROM public.surveys
    WHERE status = 'trashed'
      AND deleted_at IS NOT NULL
      AND deleted_at < now() - interval '30 days';
END;
$$;

ALTER FUNCTION "public"."purge_trashed_surveys"() OWNER TO "postgres";

-- -----------------------------------------------------------------------------
-- 7. UPDATE RPC: get_user_surveys_with_counts — add trash fields
-- -----------------------------------------------------------------------------

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
                'archivedAt', s.archived_at,
                'cancelledAt', s.cancelled_at,
                'completedAt', s.completed_at,
                'createdAt', s.created_at,
                'updatedAt', s.updated_at,
                'avgCompletionSeconds', ct.avg_secs,
                'avgQuestionCompletion', aqc.avg_pct,
                'projectId', s.project_id,
                'researchPhase', s.research_phase,
                'projectName', p.name,
                'deletedAt', s.deleted_at,
                'preTrashStatus', s.pre_trash_status,
                'previousStatus', s.previous_status
            ) ORDER BY s.updated_at DESC
        )
        FROM public.surveys s

        LEFT JOIN public.projects p ON p.id = s.project_id

        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            GROUP BY survey_id
        ) rc ON rc.survey_id = s.id

        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            WHERE status = 'completed'
            GROUP BY survey_id
        ) cc ON cc.survey_id = s.id

        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_questions
            GROUP BY survey_id
        ) qc ON qc.survey_id = s.id

        LEFT JOIN (
            SELECT survey_id, max(completed_at) AS last_at
            FROM public.survey_responses
            WHERE status = 'completed'
              AND completed_at IS NOT NULL
            GROUP BY survey_id
        ) lr ON lr.survey_id = s.id

        LEFT JOIN LATERAL (
            SELECT jsonb_agg(day_count ORDER BY day) AS daily
            FROM (
                SELECT d.day, COALESCE(cnt.c, 0) AS day_count
                FROM generate_series(
                    (current_date - interval '13 days')::date,
                    current_date,
                    interval '1 day'
                ) AS d(day)
                LEFT JOIN (
                    SELECT created_at::date AS rday, count(*) AS c
                    FROM public.survey_responses
                    WHERE survey_id = s.id AND status = 'completed'
                      AND created_at >= (current_date - interval '13 days')
                    GROUP BY created_at::date
                ) cnt ON cnt.rday = d.day
            ) sub
        ) ra ON true

        LEFT JOIN (
            SELECT survey_id,
                   round(avg(extract(epoch FROM (completed_at - started_at))))::int AS avg_secs
            FROM public.survey_responses
            WHERE status = 'completed'
              AND completed_at IS NOT NULL
              AND started_at IS NOT NULL
            GROUP BY survey_id
        ) ct ON ct.survey_id = s.id

        LEFT JOIN LATERAL (
            SELECT count(*) AS total_answers
            FROM public.survey_answers a
            JOIN public.survey_responses r ON r.id = a.response_id
            WHERE r.survey_id = s.id
              AND r.status = 'completed'
        ) ac ON true

        LEFT JOIN LATERAL (
            SELECT CASE
                       WHEN COALESCE(cc.cnt, 0) = 0 OR COALESCE(qc.cnt, 0) = 0 THEN NULL
                       ELSE round(
                           COALESCE(ac.total_answers, 0)::numeric
                           / (COALESCE(cc.cnt, 0) * COALESCE(qc.cnt, 0))
                           * 100
                       )::int
                   END AS avg_pct
        ) aqc ON true

        WHERE s.user_id = p_user_id
    ), '[]'::jsonb);
END;
$$;

-- -----------------------------------------------------------------------------
-- 8. UPDATE RPC: get_project_surveys_with_counts — add trash fields
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."get_project_surveys_with_counts"(
    "p_user_id" "uuid",
    "p_project_id" "uuid"
) RETURNS "jsonb"
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
                'archivedAt', s.archived_at,
                'cancelledAt', s.cancelled_at,
                'completedAt', s.completed_at,
                'createdAt', s.created_at,
                'updatedAt', s.updated_at,
                'avgCompletionSeconds', ct.avg_secs,
                'avgQuestionCompletion', aqc.avg_pct,
                'projectId', s.project_id,
                'projectName', p.name,
                'researchPhase', s.research_phase,
                'deletedAt', s.deleted_at,
                'preTrashStatus', s.pre_trash_status,
                'previousStatus', s.previous_status
            ) ORDER BY s.updated_at DESC
        )
        FROM public.surveys s

        LEFT JOIN public.projects p ON p.id = s.project_id

        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            GROUP BY survey_id
        ) rc ON rc.survey_id = s.id

        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            WHERE status = 'completed'
            GROUP BY survey_id
        ) cc ON cc.survey_id = s.id

        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_questions
            GROUP BY survey_id
        ) qc ON qc.survey_id = s.id

        LEFT JOIN (
            SELECT survey_id, max(completed_at) AS last_at
            FROM public.survey_responses
            WHERE status = 'completed'
              AND completed_at IS NOT NULL
            GROUP BY survey_id
        ) lr ON lr.survey_id = s.id

        LEFT JOIN LATERAL (
            SELECT jsonb_agg(day_count ORDER BY day) AS daily
            FROM (
                SELECT d.day, COALESCE(cnt.c, 0) AS day_count
                FROM generate_series(
                    (current_date - interval '13 days')::date,
                    current_date,
                    interval '1 day'
                ) AS d(day)
                LEFT JOIN (
                    SELECT created_at::date AS rday, count(*) AS c
                    FROM public.survey_responses
                    WHERE survey_id = s.id AND status = 'completed'
                      AND created_at >= (current_date - interval '13 days')
                    GROUP BY created_at::date
                ) cnt ON cnt.rday = d.day
            ) sub
        ) ra ON true

        LEFT JOIN (
            SELECT survey_id,
                   round(avg(extract(epoch FROM (completed_at - started_at))))::int AS avg_secs
            FROM public.survey_responses
            WHERE status = 'completed'
              AND completed_at IS NOT NULL
              AND started_at IS NOT NULL
            GROUP BY survey_id
        ) ct ON ct.survey_id = s.id

        LEFT JOIN LATERAL (
            SELECT count(*) AS total_answers
            FROM public.survey_answers a
            JOIN public.survey_responses r ON r.id = a.response_id
            WHERE r.survey_id = s.id
              AND r.status = 'completed'
        ) ac ON true

        LEFT JOIN LATERAL (
            SELECT CASE
                       WHEN COALESCE(cc.cnt, 0) = 0 OR COALESCE(qc.cnt, 0) = 0 THEN NULL
                       ELSE round(
                           COALESCE(ac.total_answers, 0)::numeric
                           / (COALESCE(cc.cnt, 0) * COALESCE(qc.cnt, 0))
                           * 100
                       )::int
                   END AS avg_pct
        ) aqc ON true

        WHERE s.user_id = p_user_id
          AND s.project_id = p_project_id
    ), '[]'::jsonb);
END;
$$;
