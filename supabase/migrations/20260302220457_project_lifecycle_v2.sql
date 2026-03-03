-- =============================================================================
-- Migration: project_lifecycle_v2
-- Description: Expand project statuses to active/completed/archived/trashed,
--              add soft-delete (trash) with 30-day auto-purge, update
--              dashboard RPC to include completed projects.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD NEW COLUMNS
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."projects"
    ADD COLUMN IF NOT EXISTS "completed_at" timestamptz,
    ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz,
    ADD COLUMN IF NOT EXISTS "pre_trash_status" text;

COMMENT ON COLUMN "public"."projects"."completed_at"
    IS 'When the project was marked as completed.';
COMMENT ON COLUMN "public"."projects"."deleted_at"
    IS 'When the project was soft-deleted (trashed). Auto-purged after 30 days.';
COMMENT ON COLUMN "public"."projects"."pre_trash_status"
    IS 'The status before trashing, used to restore to the correct state.';

-- -----------------------------------------------------------------------------
-- 2. UPDATE CHECK CONSTRAINTS
-- -----------------------------------------------------------------------------

-- Expand status enum to include 'completed' and 'trashed'
ALTER TABLE "public"."projects" DROP CONSTRAINT IF EXISTS "projects_status_check";
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_status_check"
    CHECK ("status" = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text, 'trashed'::text]));

-- pre_trash_status can only be a non-trash status (or NULL)
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_pre_trash_status_check"
    CHECK ("pre_trash_status" IS NULL OR "pre_trash_status" = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text]));

-- -----------------------------------------------------------------------------
-- 3. ADD INDEX FOR CRON PURGE
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "projects_deleted_at_idx"
    ON "public"."projects" USING btree ("deleted_at")
    WHERE "deleted_at" IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. CREATE PURGE FUNCTION
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."purge_trashed_projects"()
RETURNS void
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO ''
AS $$
BEGIN
    DELETE FROM public.projects
    WHERE status = 'trashed'
      AND deleted_at IS NOT NULL
      AND deleted_at < now() - interval '30 days';
END;
$$;

ALTER FUNCTION "public"."purge_trashed_projects"() OWNER TO "postgres";

-- -----------------------------------------------------------------------------
-- 5. UPDATE RPC: get_dashboard_overview — include completed projects
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."get_dashboard_overview"(
  "p_user_id" "uuid"
) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
AS $$
BEGIN
    -- Auth check
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(row_data ORDER BY updated_at DESC)
        FROM (
            SELECT
                jsonb_build_object(
                    'id', p.id,
                    'name', p.name,
                    'summary', p.summary,
                    'status', p.status,
                    'updatedAt', p.updated_at,
                    'surveyCount', COUNT(DISTINCT s.id)::int,
                    'responseCount', COALESCE(SUM(resp_counts.cnt), 0)::int
                ) AS row_data,
                p.updated_at
            FROM public.projects p
            LEFT JOIN public.surveys s ON s.project_id = p.id
            LEFT JOIN (
                SELECT survey_id, COUNT(*)::int AS cnt
                FROM public.survey_responses
                GROUP BY survey_id
            ) resp_counts ON resp_counts.survey_id = s.id
            WHERE p.user_id = p_user_id AND p.status IN ('active', 'completed')
            GROUP BY p.id, p.name, p.summary, p.status, p.updated_at
        ) sub
    ), '[]'::jsonb);
END;
$$;
