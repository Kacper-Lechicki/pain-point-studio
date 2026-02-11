-- =============================================================================
-- Question Type enum
-- =============================================================================

CREATE TYPE "public"."question_type" AS ENUM (
    'open_text',
    'short_text',
    'multiple_choice',
    'rating_scale',
    'yes_no'
);


-- =============================================================================
-- Survey Questions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."survey_questions" (
    "id"          "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "survey_id"   "uuid" NOT NULL,
    "text"        "text" NOT NULL,
    "type"        "public"."question_type" NOT NULL,
    "required"    boolean DEFAULT true NOT NULL,
    "description" "text",
    "config"      "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "sort_order"  integer NOT NULL,
    "created_at"  timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at"  timestamp with time zone DEFAULT "now"() NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "survey_questions_text_check" CHECK ("char_length"("text") <= 500),
    CONSTRAINT "survey_questions_description_check" CHECK ("description" IS NULL OR "char_length"("description") <= 500),
    CONSTRAINT "survey_questions_sort_order_check" CHECK ("sort_order" >= 0),
    CONSTRAINT "survey_questions_config_is_object" CHECK ("jsonb_typeof"("config") = 'object')
);

ALTER TABLE "public"."survey_questions" OWNER TO "postgres";

-- Foreign keys
ALTER TABLE ONLY "public"."survey_questions"
    ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id")
    REFERENCES "public"."surveys"("id") ON DELETE CASCADE;

-- Indexes
CREATE INDEX "survey_questions_survey_id_idx" ON "public"."survey_questions" ("survey_id");
CREATE UNIQUE INDEX "survey_questions_survey_id_sort_order_idx"
    ON "public"."survey_questions" ("survey_id", "sort_order");

-- Trigger for updated_at (reuses existing function)
CREATE OR REPLACE TRIGGER "survey_questions_set_updated_at"
    BEFORE UPDATE ON "public"."survey_questions"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- RLS
ALTER TABLE "public"."survey_questions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create questions for own surveys" ON "public"."survey_questions"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."surveys"
            WHERE "surveys"."id" = "survey_questions"."survey_id"
              AND "surveys"."user_id" = ( SELECT "auth"."uid"() )
        )
    );

CREATE POLICY "Users can read questions for own surveys" ON "public"."survey_questions"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."surveys"
            WHERE "surveys"."id" = "survey_questions"."survey_id"
              AND "surveys"."user_id" = ( SELECT "auth"."uid"() )
        )
    );

CREATE POLICY "Users can update questions for own surveys" ON "public"."survey_questions"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."surveys"
            WHERE "surveys"."id" = "survey_questions"."survey_id"
              AND "surveys"."user_id" = ( SELECT "auth"."uid"() )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."surveys"
            WHERE "surveys"."id" = "survey_questions"."survey_id"
              AND "surveys"."user_id" = ( SELECT "auth"."uid"() )
        )
    );

CREATE POLICY "Users can delete questions for own surveys" ON "public"."survey_questions"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "public"."surveys"
            WHERE "surveys"."id" = "survey_questions"."survey_id"
              AND "surveys"."user_id" = ( SELECT "auth"."uid"() )
        )
    );

-- Grants
GRANT ALL ON TABLE "public"."survey_questions" TO "anon";
GRANT ALL ON TABLE "public"."survey_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_questions" TO "service_role";
