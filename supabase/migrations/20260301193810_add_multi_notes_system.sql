-- =============================================================================
-- Migration: add_multi_notes_system
-- Description: Replace single notes_json column on projects with a full
--              multi-note system: project_note_folders + project_notes tables,
--              supporting folders, pinning, soft delete, and sort ordering.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREATE TABLE project_note_folders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."project_note_folders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,

    CONSTRAINT "project_note_folders_name_check"
        CHECK (("char_length"("name") <= 100))
);

ALTER TABLE "public"."project_note_folders" OWNER TO "postgres";

-- Primary key
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'project_note_folders_pkey') THEN
        ALTER TABLE ONLY "public"."project_note_folders"
            ADD CONSTRAINT "project_note_folders_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- Foreign key: project_id → projects (cascade delete)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'project_note_folders_project_id_fkey') THEN
        ALTER TABLE ONLY "public"."project_note_folders"
            ADD CONSTRAINT "project_note_folders_project_id_fkey"
            FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Foreign key: user_id → auth.users (cascade delete)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'project_note_folders_user_id_fkey') THEN
        ALTER TABLE ONLY "public"."project_note_folders"
            ADD CONSTRAINT "project_note_folders_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "project_note_folders_project_id_idx"
    ON "public"."project_note_folders" USING "btree" ("project_id");

CREATE INDEX IF NOT EXISTS "project_note_folders_user_id_idx"
    ON "public"."project_note_folders" USING "btree" ("user_id");

-- Trigger: set_updated_at
CREATE OR REPLACE TRIGGER "project_note_folders_set_updated_at"
    BEFORE UPDATE ON "public"."project_note_folders"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_updated_at"();

-- RLS
ALTER TABLE "public"."project_note_folders" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own note folders" ON "public"."project_note_folders";
CREATE POLICY "Users can select own note folders" ON "public"."project_note_folders"
    FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

DROP POLICY IF EXISTS "Users can insert own note folders" ON "public"."project_note_folders";
CREATE POLICY "Users can insert own note folders" ON "public"."project_note_folders"
    FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

DROP POLICY IF EXISTS "Users can update own note folders" ON "public"."project_note_folders";
CREATE POLICY "Users can update own note folders" ON "public"."project_note_folders"
    FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"))
    WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

DROP POLICY IF EXISTS "Users can delete own note folders" ON "public"."project_note_folders";
CREATE POLICY "Users can delete own note folders" ON "public"."project_note_folders"
    FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- Grants
GRANT ALL ON TABLE "public"."project_note_folders" TO "anon";
GRANT ALL ON TABLE "public"."project_note_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."project_note_folders" TO "service_role";

-- -----------------------------------------------------------------------------
-- 2. CREATE TABLE project_notes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."project_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "folder_id" "uuid",
    "title" "text" DEFAULT 'Untitled'::"text" NOT NULL,
    "content_json" "jsonb",
    "is_pinned" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,

    CONSTRAINT "project_notes_title_check"
        CHECK (("char_length"("title") <= 200)),
    CONSTRAINT "project_notes_sort_order_check"
        CHECK (("sort_order" >= 0))
);

ALTER TABLE "public"."project_notes" OWNER TO "postgres";

-- Primary key
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'project_notes_pkey') THEN
        ALTER TABLE ONLY "public"."project_notes"
            ADD CONSTRAINT "project_notes_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- Foreign key: project_id → projects (cascade delete)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'project_notes_project_id_fkey') THEN
        ALTER TABLE ONLY "public"."project_notes"
            ADD CONSTRAINT "project_notes_project_id_fkey"
            FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Foreign key: user_id → auth.users (cascade delete)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'project_notes_user_id_fkey') THEN
        ALTER TABLE ONLY "public"."project_notes"
            ADD CONSTRAINT "project_notes_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Foreign key: folder_id → project_note_folders (set null on delete)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'project_notes_folder_id_fkey') THEN
        ALTER TABLE ONLY "public"."project_notes"
            ADD CONSTRAINT "project_notes_folder_id_fkey"
            FOREIGN KEY ("folder_id") REFERENCES "public"."project_note_folders"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "project_notes_project_id_idx"
    ON "public"."project_notes" USING "btree" ("project_id");

CREATE INDEX IF NOT EXISTS "project_notes_user_id_idx"
    ON "public"."project_notes" USING "btree" ("user_id");

CREATE INDEX IF NOT EXISTS "project_notes_folder_id_idx"
    ON "public"."project_notes" USING "btree" ("folder_id");

CREATE INDEX IF NOT EXISTS "project_notes_deleted_at_idx"
    ON "public"."project_notes" USING "btree" ("deleted_at")
    WHERE ("deleted_at" IS NOT NULL);

-- Trigger: set_updated_at
CREATE OR REPLACE TRIGGER "project_notes_set_updated_at"
    BEFORE UPDATE ON "public"."project_notes"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_updated_at"();

-- RLS
ALTER TABLE "public"."project_notes" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own notes" ON "public"."project_notes";
CREATE POLICY "Users can select own notes" ON "public"."project_notes"
    FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

DROP POLICY IF EXISTS "Users can insert own notes" ON "public"."project_notes";
CREATE POLICY "Users can insert own notes" ON "public"."project_notes"
    FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

DROP POLICY IF EXISTS "Users can update own notes" ON "public"."project_notes";
CREATE POLICY "Users can update own notes" ON "public"."project_notes"
    FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"))
    WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

DROP POLICY IF EXISTS "Users can delete own notes" ON "public"."project_notes";
CREATE POLICY "Users can delete own notes" ON "public"."project_notes"
    FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- Grants
GRANT ALL ON TABLE "public"."project_notes" TO "anon";
GRANT ALL ON TABLE "public"."project_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."project_notes" TO "service_role";

-- -----------------------------------------------------------------------------
-- 3. DROP old notes_json column from projects
-- -----------------------------------------------------------------------------
ALTER TABLE "public"."projects" DROP COLUMN IF EXISTS "notes_json";
