-- =============================================================================
-- Survey Categories lookup table (follows roles / social_link_types pattern)
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."survey_categories" (
    "id" integer NOT NULL,
    "value" "text" NOT NULL,
    "label_key" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);

ALTER TABLE "public"."survey_categories" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."survey_categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."survey_categories_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."survey_categories_id_seq" OWNED BY "public"."survey_categories"."id";

ALTER TABLE ONLY "public"."survey_categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."survey_categories_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."survey_categories"
    ADD CONSTRAINT "survey_categories_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."survey_categories"
    ADD CONSTRAINT "survey_categories_value_key" UNIQUE ("value");

-- Seed categories
INSERT INTO "public"."survey_categories" ("value", "label_key", "sort_order", "is_active") VALUES
    ('productivity',    'surveys.categories.productivity',    1,  true),
    ('health',          'surveys.categories.health',          2,  true),
    ('finance',         'surveys.categories.finance',         3,  true),
    ('education',       'surveys.categories.education',       4,  true),
    ('developer-tools', 'surveys.categories.developerTools',  5,  true),
    ('design',          'surveys.categories.design',          6,  true),
    ('marketing',       'surveys.categories.marketing',       7,  true),
    ('communication',   'surveys.categories.communication',   8,  true),
    ('entertainment',   'surveys.categories.entertainment',   9,  true),
    ('other',           'surveys.categories.other',           10, true);

-- RLS
ALTER TABLE "public"."survey_categories" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Survey categories are publicly readable" ON "public"."survey_categories"
    FOR SELECT USING (true);

-- Grants
GRANT ALL ON TABLE "public"."survey_categories" TO "anon";
GRANT ALL ON TABLE "public"."survey_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_categories" TO "service_role";

GRANT ALL ON SEQUENCE "public"."survey_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."survey_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."survey_categories_id_seq" TO "service_role";


-- =============================================================================
-- Survey Status enum
-- =============================================================================

CREATE TYPE "public"."survey_status" AS ENUM ('draft', 'active', 'closed', 'archived');


-- =============================================================================
-- Surveys table
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."surveys" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "visibility" "text" DEFAULT 'private'::"text" NOT NULL,
    "status" "public"."survey_status" DEFAULT 'draft'::"public"."survey_status" NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "max_respondents" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "surveys_title_check" CHECK ("char_length"("title") <= 100),
    CONSTRAINT "surveys_description_check" CHECK ("char_length"("description") <= 2000),
    CONSTRAINT "surveys_visibility_check" CHECK ("visibility" IN ('private', 'public')),
    CONSTRAINT "surveys_max_respondents_check" CHECK ("max_respondents" IS NULL OR "max_respondents" >= 1),
    CONSTRAINT "surveys_dates_check" CHECK ("ends_at" IS NULL OR "starts_at" IS NULL OR "ends_at" > "starts_at")
);

ALTER TABLE "public"."surveys" OWNER TO "postgres";

-- Foreign keys
ALTER TABLE ONLY "public"."surveys"
    ADD CONSTRAINT "surveys_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."surveys"
    ADD CONSTRAINT "surveys_category_fk" FOREIGN KEY ("category")
    REFERENCES "public"."survey_categories"("value") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Indexes
CREATE INDEX "surveys_user_id_idx" ON "public"."surveys" ("user_id");
CREATE INDEX "surveys_user_id_status_idx" ON "public"."surveys" ("user_id", "status");

-- Trigger for updated_at (reuses existing function)
CREATE OR REPLACE TRIGGER "surveys_set_updated_at"
    BEFORE UPDATE ON "public"."surveys"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- RLS
ALTER TABLE "public"."surveys" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own surveys" ON "public"."surveys"
    FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can read own surveys" ON "public"."surveys"
    FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can update own surveys" ON "public"."surveys"
    FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"))
    WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can delete own surveys" ON "public"."surveys"
    FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- Grants
GRANT ALL ON TABLE "public"."surveys" TO "anon";
GRANT ALL ON TABLE "public"."surveys" TO "authenticated";
GRANT ALL ON TABLE "public"."surveys" TO "service_role";
