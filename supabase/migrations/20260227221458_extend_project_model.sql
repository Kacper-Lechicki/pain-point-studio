-- =============================================================================
-- Migration: extend_project_model
-- Description: Rename description→summary, add description (JSONB for Tiptap),
--              add image_url, create project-images storage bucket.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RENAME description → summary
-- -----------------------------------------------------------------------------
ALTER TABLE "public"."projects" RENAME COLUMN "description" TO "summary";

-- Drop old constraint, add new one with 280 char limit
ALTER TABLE "public"."projects" DROP CONSTRAINT IF EXISTS "projects_description_check";
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_summary_check"
    CHECK (("summary" IS NULL) OR ("char_length"("summary") <= 280));

-- -----------------------------------------------------------------------------
-- 2. ADD new columns
-- -----------------------------------------------------------------------------
ALTER TABLE "public"."projects" ADD COLUMN IF NOT EXISTS "description" "jsonb";
ALTER TABLE "public"."projects" ADD COLUMN IF NOT EXISTS "image_url" "text";

COMMENT ON COLUMN "public"."projects"."summary" IS 'Short one-liner (max 280 chars). Shown on cards and headers.';
COMMENT ON COLUMN "public"."projects"."description" IS 'Rich content as Tiptap JSON document. Shown on project detail.';
COMMENT ON COLUMN "public"."projects"."image_url" IS 'URL to project thumbnail image in Supabase Storage.';

-- -----------------------------------------------------------------------------
-- 3. UPDATE RPC: get_dashboard_overview (p.description → p.summary)
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
            WHERE p.user_id = p_user_id AND p.status = 'active'
            GROUP BY p.id, p.name, p.summary, p.status, p.updated_at
        ) sub
    ), '[]'::jsonb);
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. STORAGE: project-images bucket + RLS policies
-- -----------------------------------------------------------------------------
INSERT INTO "storage"."buckets" ("id", "name", "public")
VALUES ('project-images', 'project-images', true)
ON CONFLICT ("id") DO NOTHING;

DROP POLICY IF EXISTS "Project images are publicly readable" ON "storage"."objects";
CREATE POLICY "Project images are publicly readable" ON "storage"."objects"
    FOR SELECT USING (("bucket_id" = 'project-images'::"text"));

DROP POLICY IF EXISTS "Users can upload own project image" ON "storage"."objects";
CREATE POLICY "Users can upload own project image" ON "storage"."objects"
    FOR INSERT WITH CHECK ((("bucket_id" = 'project-images'::"text")
        AND ((( SELECT "auth"."uid"() AS "uid"))::"text" = ("storage"."foldername"("name"))[1])));

DROP POLICY IF EXISTS "Users can update own project image" ON "storage"."objects";
CREATE POLICY "Users can update own project image" ON "storage"."objects"
    FOR UPDATE USING ((("bucket_id" = 'project-images'::"text")
        AND ((( SELECT "auth"."uid"() AS "uid"))::"text" = ("storage"."foldername"("name"))[1])));

DROP POLICY IF EXISTS "Users can delete own project image" ON "storage"."objects";
CREATE POLICY "Users can delete own project image" ON "storage"."objects"
    FOR DELETE USING ((("bucket_id" = 'project-images'::"text")
        AND ((( SELECT "auth"."uid"() AS "uid"))::"text" = ("storage"."foldername"("name"))[1])));
