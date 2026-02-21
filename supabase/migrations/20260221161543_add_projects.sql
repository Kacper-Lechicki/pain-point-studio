-- =============================================================================
-- Migration: add_projects
-- Description: Create projects and project_insights tables, add project_id
--              and research_phase columns to surveys.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE TABLE projects
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "context" "text" DEFAULT 'custom'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,

    CONSTRAINT "projects_name_check"
        CHECK (("char_length"("name") <= 100)),
    CONSTRAINT "projects_description_check"
        CHECK (("description" IS NULL) OR ("char_length"("description") <= 500)),
    CONSTRAINT "projects_context_check"
        CHECK (("context" = ANY (ARRAY['idea_validation'::"text", 'custom'::"text"]))),
    CONSTRAINT "projects_status_check"
        CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text"])))
);

ALTER TABLE "public"."projects" OWNER TO "postgres";

-- Primary key
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'projects_pkey') THEN
        ALTER TABLE ONLY "public"."projects"
            ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- Foreign key: user_id → auth.users (cascade delete)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'projects_user_id_fkey') THEN
        ALTER TABLE ONLY "public"."projects"
            ADD CONSTRAINT "projects_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Index on user_id
CREATE INDEX IF NOT EXISTS "projects_user_id_idx"
    ON "public"."projects" USING "btree" ("user_id");

-- Trigger: set_updated_at
CREATE OR REPLACE TRIGGER "projects_set_updated_at"
    BEFORE UPDATE ON "public"."projects"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_updated_at"();

-- RLS
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own projects" ON "public"."projects";
CREATE POLICY "Users can select own projects" ON "public"."projects"
    FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

DROP POLICY IF EXISTS "Users can insert own projects" ON "public"."projects";
CREATE POLICY "Users can insert own projects" ON "public"."projects"
    FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

DROP POLICY IF EXISTS "Users can update own projects" ON "public"."projects";
CREATE POLICY "Users can update own projects" ON "public"."projects"
    FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"))
    WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

DROP POLICY IF EXISTS "Users can delete own projects" ON "public"."projects";
CREATE POLICY "Users can delete own projects" ON "public"."projects"
    FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- Grants
GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";

-- -----------------------------------------------------------------------------
-- 2. CREATE TABLE project_insights
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."project_insights" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "phase" "text",
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,

    CONSTRAINT "project_insights_type_check"
        CHECK (("type" = ANY (ARRAY['strength'::"text", 'threat'::"text", 'decision'::"text"]))),
    CONSTRAINT "project_insights_content_check"
        CHECK (("char_length"("content") <= 500)),
    CONSTRAINT "project_insights_phase_check"
        CHECK (("phase" IS NULL) OR ("phase" = ANY (ARRAY[
            'problem_discovery'::"text",
            'solution_validation'::"text",
            'market_validation'::"text",
            'launch_readiness'::"text"
        ])))
);

ALTER TABLE "public"."project_insights" OWNER TO "postgres";

-- Primary key
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'project_insights_pkey') THEN
        ALTER TABLE ONLY "public"."project_insights"
            ADD CONSTRAINT "project_insights_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- Foreign key: project_id → projects (cascade delete)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'project_insights_project_id_fkey') THEN
        ALTER TABLE ONLY "public"."project_insights"
            ADD CONSTRAINT "project_insights_project_id_fkey"
            FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Index on project_id
CREATE INDEX IF NOT EXISTS "project_insights_project_id_idx"
    ON "public"."project_insights" USING "btree" ("project_id");

-- Trigger: set_updated_at
CREATE OR REPLACE TRIGGER "project_insights_set_updated_at"
    BEFORE UPDATE ON "public"."project_insights"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_updated_at"();

-- RLS
ALTER TABLE "public"."project_insights" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own project insights" ON "public"."project_insights";
CREATE POLICY "Users can select own project insights" ON "public"."project_insights"
    FOR SELECT USING ((EXISTS (
        SELECT 1 FROM "public"."projects"
        WHERE (("projects"."id" = "project_insights"."project_id")
           AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid")))
    )));

DROP POLICY IF EXISTS "Users can insert own project insights" ON "public"."project_insights";
CREATE POLICY "Users can insert own project insights" ON "public"."project_insights"
    FOR INSERT WITH CHECK ((EXISTS (
        SELECT 1 FROM "public"."projects"
        WHERE (("projects"."id" = "project_insights"."project_id")
           AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid")))
    )));

DROP POLICY IF EXISTS "Users can update own project insights" ON "public"."project_insights";
CREATE POLICY "Users can update own project insights" ON "public"."project_insights"
    FOR UPDATE
    USING ((EXISTS (
        SELECT 1 FROM "public"."projects"
        WHERE (("projects"."id" = "project_insights"."project_id")
           AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid")))
    )))
    WITH CHECK ((EXISTS (
        SELECT 1 FROM "public"."projects"
        WHERE (("projects"."id" = "project_insights"."project_id")
           AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid")))
    )));

DROP POLICY IF EXISTS "Users can delete own project insights" ON "public"."project_insights";
CREATE POLICY "Users can delete own project insights" ON "public"."project_insights"
    FOR DELETE USING ((EXISTS (
        SELECT 1 FROM "public"."projects"
        WHERE (("projects"."id" = "project_insights"."project_id")
           AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid")))
    )));

-- Grants
GRANT ALL ON TABLE "public"."project_insights" TO "anon";
GRANT ALL ON TABLE "public"."project_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."project_insights" TO "service_role";

-- -----------------------------------------------------------------------------
-- 3. ALTER TABLE surveys — add project_id and research_phase
-- -----------------------------------------------------------------------------
ALTER TABLE "public"."surveys"
    ADD COLUMN IF NOT EXISTS "project_id" "uuid",
    ADD COLUMN IF NOT EXISTS "research_phase" "text";

-- Foreign key: project_id → projects (SET NULL on delete)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'surveys_project_id_fkey') THEN
        ALTER TABLE ONLY "public"."surveys"
            ADD CONSTRAINT "surveys_project_id_fkey"
            FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- CHECK constraint on research_phase
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'surveys_research_phase_check') THEN
        ALTER TABLE "public"."surveys"
            ADD CONSTRAINT "surveys_research_phase_check"
            CHECK (("research_phase" IS NULL) OR ("research_phase" = ANY (ARRAY[
                'problem_discovery'::"text",
                'solution_validation'::"text",
                'market_validation'::"text",
                'launch_readiness'::"text"
            ])));
    END IF;
END $$;

-- Index on project_id
CREATE INDEX IF NOT EXISTS "surveys_project_id_idx"
    ON "public"."surveys" USING "btree" ("project_id");
