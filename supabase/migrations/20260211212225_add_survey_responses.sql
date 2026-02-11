-- =============================================================================
-- Add slug column to surveys table
-- =============================================================================

ALTER TABLE "public"."surveys"
    ADD COLUMN "slug" "text";

-- Unique index for slug lookups (only on non-null slugs — drafts have no slug)
CREATE UNIQUE INDEX "surveys_slug_unique_idx"
    ON "public"."surveys" ("slug")
    WHERE "slug" IS NOT NULL;

-- Constraint: slug format (alphanumeric + underscore + hyphen, 8-21 chars)
ALTER TABLE "public"."surveys"
    ADD CONSTRAINT "surveys_slug_format_check"
    CHECK ("slug" IS NULL OR "slug" ~ '^[A-Za-z0-9_-]{8,21}$');


-- =============================================================================
-- Survey Responses table
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id"            "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "survey_id"     "uuid" NOT NULL,
    "status"        "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "contact_name"  "text",
    "contact_email" "text",
    "feedback"      "text",
    "started_at"    timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at"  timestamp with time zone,
    "created_at"    timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at"    timestamp with time zone DEFAULT "now"() NOT NULL,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "survey_responses_status_check" CHECK ("status" IN ('in_progress', 'completed')),
    CONSTRAINT "survey_responses_contact_name_check" CHECK ("contact_name" IS NULL OR "char_length"("contact_name") <= 100),
    CONSTRAINT "survey_responses_contact_email_check" CHECK ("contact_email" IS NULL OR "char_length"("contact_email") <= 320),
    CONSTRAINT "survey_responses_feedback_check" CHECK ("feedback" IS NULL OR "char_length"("feedback") <= 2000)
);

ALTER TABLE "public"."survey_responses" OWNER TO "postgres";

-- Foreign key
ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id")
    REFERENCES "public"."surveys"("id") ON DELETE CASCADE;

-- Indexes
CREATE INDEX "survey_responses_survey_id_idx" ON "public"."survey_responses" ("survey_id");
CREATE INDEX "survey_responses_survey_id_status_idx" ON "public"."survey_responses" ("survey_id", "status");

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER "survey_responses_set_updated_at"
    BEFORE UPDATE ON "public"."survey_responses"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


-- =============================================================================
-- Survey Answers table
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."survey_answers" (
    "id"           "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "response_id"  "uuid" NOT NULL,
    "question_id"  "uuid" NOT NULL,
    "value"        "jsonb" NOT NULL,
    "created_at"   timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at"   timestamp with time zone DEFAULT "now"() NOT NULL,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "survey_answers_value_is_object" CHECK ("jsonb_typeof"("value") = 'object')
);

ALTER TABLE "public"."survey_answers" OWNER TO "postgres";

-- Foreign keys
ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id")
    REFERENCES "public"."survey_responses"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id")
    REFERENCES "public"."survey_questions"("id") ON DELETE CASCADE;

-- Unique constraint for upsert (one answer per question per response)
ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_response_question_unique"
    UNIQUE ("response_id", "question_id");

-- Index for analytics aggregation by question
CREATE INDEX "survey_answers_question_id_idx" ON "public"."survey_answers" ("question_id");

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER "survey_answers_set_updated_at"
    BEFORE UPDATE ON "public"."survey_answers"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


-- =============================================================================
-- RLS: Public access to active surveys (respondent-facing)
-- =============================================================================

-- Anyone can read active surveys with a slug (for respondent landing page)
CREATE POLICY "Anyone can read active surveys by slug" ON "public"."surveys"
    FOR SELECT USING (
        "status" = 'active'
        AND "slug" IS NOT NULL
    );

-- Anyone can read questions for active surveys (respondent needs to see them)
CREATE POLICY "Anyone can read questions for active surveys" ON "public"."survey_questions"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."surveys"
            WHERE "surveys"."id" = "survey_questions"."survey_id"
              AND "surveys"."status" = 'active'
              AND "surveys"."slug" IS NOT NULL
        )
    );


-- =============================================================================
-- RLS: Survey Responses
-- =============================================================================

ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;

-- Anyone can create a response for an active survey
CREATE POLICY "Anyone can create response for active survey" ON "public"."survey_responses"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."surveys"
            WHERE "surveys"."id" = "survey_responses"."survey_id"
              AND "surveys"."status" = 'active'
              AND "surveys"."slug" IS NOT NULL
        )
    );

-- Anyone can read responses (needed for respondent to resume + creator to view stats)
CREATE POLICY "Anyone can read responses" ON "public"."survey_responses"
    FOR SELECT USING (true);

-- Anyone can update an in-progress response (to complete it)
CREATE POLICY "Anyone can update in-progress response" ON "public"."survey_responses"
    FOR UPDATE USING ("status" = 'in_progress')
    WITH CHECK ("status" IN ('in_progress', 'completed'));


-- =============================================================================
-- RLS: Survey Answers
-- =============================================================================

ALTER TABLE "public"."survey_answers" ENABLE ROW LEVEL SECURITY;

-- Anyone can insert answers for an in-progress response
CREATE POLICY "Anyone can insert answer for in-progress response" ON "public"."survey_answers"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."survey_responses"
            WHERE "survey_responses"."id" = "survey_answers"."response_id"
              AND "survey_responses"."status" = 'in_progress'
        )
    );

-- Anyone can update answers for an in-progress response
CREATE POLICY "Anyone can update answer for in-progress response" ON "public"."survey_answers"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."survey_responses"
            WHERE "survey_responses"."id" = "survey_answers"."response_id"
              AND "survey_responses"."status" = 'in_progress'
        )
    );

-- Anyone can read answers (needed for respondent resume + creator stats)
CREATE POLICY "Anyone can read answers" ON "public"."survey_answers"
    FOR SELECT USING (true);


-- =============================================================================
-- Helper function: count completed responses for a survey
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."get_survey_response_count"(p_survey_id "uuid")
RETURNS integer
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" TO ''
AS $$
    SELECT COALESCE(COUNT(*)::integer, 0)
    FROM public.survey_responses
    WHERE survey_id = p_survey_id
      AND status = 'completed';
$$;

ALTER FUNCTION "public"."get_survey_response_count"("uuid") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_survey_response_count"("uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_survey_response_count"("uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_survey_response_count"("uuid") TO "service_role";


-- =============================================================================
-- Grants for new tables
-- =============================================================================

GRANT ALL ON TABLE "public"."survey_responses" TO "anon";
GRANT ALL ON TABLE "public"."survey_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_responses" TO "service_role";

GRANT ALL ON TABLE "public"."survey_answers" TO "anon";
GRANT ALL ON TABLE "public"."survey_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_answers" TO "service_role";
