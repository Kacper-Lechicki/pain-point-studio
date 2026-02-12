


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."question_type" AS ENUM (
    'open_text',
    'short_text',
    'multiple_choice',
    'rating_scale',
    'yes_no'
);


ALTER TYPE "public"."question_type" OWNER TO "postgres";


CREATE TYPE "public"."survey_status" AS ENUM (
    'draft',
    'active',
    'closed',
    'archived'
);


ALTER TYPE "public"."survey_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_email_change"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE auth.users
  SET
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    email_change_confirm_status = 0,
    email_change_sent_at = NULL
  WHERE id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."cancel_email_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_email_change_status"() RETURNS TABLE("new_email" "text", "confirm_status" smallint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT
    u.email_change::text AS new_email,
    u.email_change_confirm_status AS confirm_status
  FROM auth.users u
  WHERE u.id = auth.uid()
    AND u.email_change IS NOT NULL
    AND u.email_change <> '';
$$;


ALTER FUNCTION "public"."get_email_change_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT COALESCE(COUNT(*)::integer, 0)
    FROM public.survey_responses
    WHERE survey_id = p_survey_id
      AND status = 'completed';
$$;


ALTER FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_password"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT
    COALESCE(
      (
        SELECT length(u.encrypted_password) > 0
        FROM auth.users u
        WHERE u.id = auth.uid()
      ),
      false
    );
$$;


ALTER FUNCTION "public"."has_password"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_clearing_required_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  IF OLD.full_name <> '' AND NEW.full_name = '' THEN
    RAISE EXCEPTION 'full_name cannot be cleared once set';
  END IF;

  IF OLD.role IS NOT NULL AND OLD.role <> '' AND (NEW.role IS NULL OR NEW.role = '') THEN
    RAISE EXCEPTION 'role cannot be cleared once set';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_clearing_required_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_password"("current_plain_password" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND encrypted_password IS NOT NULL
      AND encrypted_password <> ''
      AND encrypted_password = crypt(current_plain_password, encrypted_password)
  );
END;
$$;


ALTER FUNCTION "public"."verify_password"("current_plain_password" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "role" "text",
    "bio" "text" DEFAULT ''::"text" NOT NULL,
    "avatar_url" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "social_links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "profiles_bio_check" CHECK (("char_length"("bio") <= 200)),
    CONSTRAINT "profiles_social_links_is_array" CHECK (("jsonb_typeof"("social_links") = 'array'::"text"))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" integer NOT NULL,
    "value" "text" NOT NULL,
    "label_key" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."roles_id_seq" OWNED BY "public"."roles"."id";



CREATE TABLE IF NOT EXISTS "public"."social_link_types" (
    "id" integer NOT NULL,
    "value" "text" NOT NULL,
    "label_key" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."social_link_types" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."social_link_types_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."social_link_types_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."social_link_types_id_seq" OWNED BY "public"."social_link_types"."id";



CREATE TABLE IF NOT EXISTS "public"."survey_answers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "response_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "value" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "survey_answers_value_is_object" CHECK (("jsonb_typeof"("value") = 'object'::"text"))
);


ALTER TABLE "public"."survey_answers" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."survey_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "type" "public"."question_type" NOT NULL,
    "required" boolean DEFAULT true NOT NULL,
    "description" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "sort_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "survey_questions_config_is_object" CHECK (("jsonb_typeof"("config") = 'object'::"text")),
    CONSTRAINT "survey_questions_description_check" CHECK ((("description" IS NULL) OR ("char_length"("description") <= 500))),
    CONSTRAINT "survey_questions_sort_order_check" CHECK (("sort_order" >= 0)),
    CONSTRAINT "survey_questions_text_check" CHECK (("char_length"("text") <= 500))
);


ALTER TABLE "public"."survey_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "contact_name" "text",
    "contact_email" "text",
    "feedback" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "survey_responses_contact_email_check" CHECK ((("contact_email" IS NULL) OR ("char_length"("contact_email") <= 320))),
    CONSTRAINT "survey_responses_contact_name_check" CHECK ((("contact_name" IS NULL) OR ("char_length"("contact_name") <= 100))),
    CONSTRAINT "survey_responses_feedback_check" CHECK ((("feedback" IS NULL) OR ("char_length"("feedback") <= 2000))),
    CONSTRAINT "survey_responses_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."survey_responses" OWNER TO "postgres";


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
    "slug" "text",
    CONSTRAINT "surveys_dates_check" CHECK ((("ends_at" IS NULL) OR ("starts_at" IS NULL) OR ("ends_at" > "starts_at"))),
    CONSTRAINT "surveys_description_check" CHECK (("char_length"("description") <= 2000)),
    CONSTRAINT "surveys_max_respondents_check" CHECK ((("max_respondents" IS NULL) OR ("max_respondents" >= 1))),
    CONSTRAINT "surveys_slug_format_check" CHECK ((("slug" IS NULL) OR ("slug" ~ '^[A-Za-z0-9_-]{8,21}$'::"text"))),
    CONSTRAINT "surveys_title_check" CHECK (("char_length"("title") <= 100)),
    CONSTRAINT "surveys_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."surveys" OWNER TO "postgres";


ALTER TABLE ONLY "public"."roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."social_link_types" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."social_link_types_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."survey_categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."survey_categories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."social_link_types"
    ADD CONSTRAINT "social_link_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_link_types"
    ADD CONSTRAINT "social_link_types_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_response_question_unique" UNIQUE ("response_id", "question_id");



ALTER TABLE ONLY "public"."survey_categories"
    ADD CONSTRAINT "survey_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_categories"
    ADD CONSTRAINT "survey_categories_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."survey_questions"
    ADD CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."surveys"
    ADD CONSTRAINT "surveys_pkey" PRIMARY KEY ("id");



CREATE INDEX "survey_answers_question_id_idx" ON "public"."survey_answers" USING "btree" ("question_id");



CREATE INDEX "survey_questions_survey_id_idx" ON "public"."survey_questions" USING "btree" ("survey_id");



CREATE UNIQUE INDEX "survey_questions_survey_id_sort_order_idx" ON "public"."survey_questions" USING "btree" ("survey_id", "sort_order");



CREATE INDEX "survey_responses_survey_id_idx" ON "public"."survey_responses" USING "btree" ("survey_id");



CREATE INDEX "survey_responses_survey_id_status_idx" ON "public"."survey_responses" USING "btree" ("survey_id", "status");



CREATE UNIQUE INDEX "surveys_slug_unique_idx" ON "public"."surveys" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



CREATE INDEX "surveys_user_id_idx" ON "public"."surveys" USING "btree" ("user_id");



CREATE INDEX "surveys_user_id_status_idx" ON "public"."surveys" USING "btree" ("user_id", "status");



CREATE OR REPLACE TRIGGER "profiles_prevent_clearing_required" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_clearing_required_fields"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "survey_answers_set_updated_at" BEFORE UPDATE ON "public"."survey_answers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "survey_questions_set_updated_at" BEFORE UPDATE ON "public"."survey_questions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "survey_responses_set_updated_at" BEFORE UPDATE ON "public"."survey_responses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "surveys_set_updated_at" BEFORE UPDATE ON "public"."surveys" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_role_fk" FOREIGN KEY ("role") REFERENCES "public"."roles"("value") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."survey_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."survey_responses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_questions"
    ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."surveys"
    ADD CONSTRAINT "surveys_category_fk" FOREIGN KEY ("category") REFERENCES "public"."survey_categories"("value") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."surveys"
    ADD CONSTRAINT "surveys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can create response for active survey" ON "public"."survey_responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_responses"."survey_id") AND ("surveys"."status" = 'active'::"public"."survey_status") AND ("surveys"."slug" IS NOT NULL)))));



CREATE POLICY "Anyone can insert answer for in-progress response" ON "public"."survey_answers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."survey_responses"
  WHERE (("survey_responses"."id" = "survey_answers"."response_id") AND ("survey_responses"."status" = 'in_progress'::"text")))));



CREATE POLICY "Anyone can read active surveys by slug" ON "public"."surveys" FOR SELECT USING ((("status" = 'active'::"public"."survey_status") AND ("slug" IS NOT NULL)));



CREATE POLICY "Anyone can read answers" ON "public"."survey_answers" FOR SELECT USING (true);



CREATE POLICY "Anyone can read questions for active surveys" ON "public"."survey_questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."status" = 'active'::"public"."survey_status") AND ("surveys"."slug" IS NOT NULL)))));



CREATE POLICY "Anyone can read responses" ON "public"."survey_responses" FOR SELECT USING (true);



CREATE POLICY "Anyone can update answer for in-progress response" ON "public"."survey_answers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."survey_responses"
  WHERE (("survey_responses"."id" = "survey_answers"."response_id") AND ("survey_responses"."status" = 'in_progress'::"text")))));



CREATE POLICY "Anyone can update in-progress response" ON "public"."survey_responses" FOR UPDATE USING (("status" = 'in_progress'::"text")) WITH CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text"])));



CREATE POLICY "Roles are publicly readable" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Social link types are publicly readable" ON "public"."social_link_types" FOR SELECT USING (true);



CREATE POLICY "Survey categories are publicly readable" ON "public"."survey_categories" FOR SELECT USING (true);



CREATE POLICY "Users can create own surveys" ON "public"."surveys" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create questions for own surveys" ON "public"."survey_questions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can delete own surveys" ON "public"."surveys" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete questions for own surveys" ON "public"."survey_questions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can read own surveys" ON "public"."surveys" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read questions for own surveys" ON "public"."survey_questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update own surveys" ON "public"."surveys" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update questions for own surveys" ON "public"."survey_questions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."social_link_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."surveys" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."cancel_email_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_email_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_email_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_email_change_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_email_change_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_email_change_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."has_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_password"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_clearing_required_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_clearing_required_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_clearing_required_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_password"("current_plain_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_password"("current_plain_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_password"("current_plain_password" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."social_link_types" TO "anon";
GRANT ALL ON TABLE "public"."social_link_types" TO "authenticated";
GRANT ALL ON TABLE "public"."social_link_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."social_link_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."social_link_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."social_link_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."survey_answers" TO "anon";
GRANT ALL ON TABLE "public"."survey_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_answers" TO "service_role";



GRANT ALL ON TABLE "public"."survey_categories" TO "anon";
GRANT ALL ON TABLE "public"."survey_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."survey_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."survey_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."survey_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."survey_questions" TO "anon";
GRANT ALL ON TABLE "public"."survey_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_questions" TO "service_role";



GRANT ALL ON TABLE "public"."survey_responses" TO "anon";
GRANT ALL ON TABLE "public"."survey_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_responses" TO "service_role";



GRANT ALL ON TABLE "public"."surveys" TO "anon";
GRANT ALL ON TABLE "public"."surveys" TO "authenticated";
GRANT ALL ON TABLE "public"."surveys" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();



CREATE POLICY "Avatars are publicly readable" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Users can delete own avatar" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'avatars'::"text") AND ((( SELECT "auth"."uid"() AS "uid"))::"text" = ("storage"."foldername"("name"))[1])));



CREATE POLICY "Users can update own avatar" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'avatars'::"text") AND ((( SELECT "auth"."uid"() AS "uid"))::"text" = ("storage"."foldername"("name"))[1])));



CREATE POLICY "Users can upload own avatar" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'avatars'::"text") AND ((( SELECT "auth"."uid"() AS "uid"))::"text" = ("storage"."foldername"("name"))[1])));



