


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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






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
    'pending',
    'active',
    'closed',
    'cancelled',
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


CREATE OR REPLACE FUNCTION "public"."decrypt_pii"("encrypted" "bytea") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_key text;
BEGIN
  IF encrypted IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key'
  LIMIT 1;

  RETURN extensions.pgp_sym_decrypt(encrypted, v_key);
END;
$$;


ALTER FUNCTION "public"."decrypt_pii"("encrypted" "bytea") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_pii"("plain_text" "text") RETURNS "bytea"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_key text;
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key'
  LIMIT 1;

  RETURN extensions.pgp_sym_encrypt(plain_text, v_key);
END;
$$;


ALTER FUNCTION "public"."encrypt_pii"("plain_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_analytics_data"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_total_responses bigint;
    v_completed_responses bigint;
    v_avg_completion_rate int;
    v_response_timeline jsonb;
    v_category_breakdown jsonb;
    v_survey_comparison jsonb;
BEGIN
    -- Aggregate response counts
    SELECT
        count(*),
        count(*) FILTER (WHERE r.status = 'completed')
    INTO v_total_responses, v_completed_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id;

    -- Average completion rate
    IF v_total_responses > 0 THEN
        v_avg_completion_rate := round((v_completed_responses::numeric / v_total_responses) * 100);
    ELSE
        v_avg_completion_rate := 0;
    END IF;

    -- 30-day response timeline
    SELECT COALESCE(jsonb_agg(day_count ORDER BY day), '[]'::jsonb)
    INTO v_response_timeline
    FROM (
        SELECT d.day, COALESCE(cnt.c, 0) AS day_count
        FROM generate_series(
            (current_date - interval '29 days')::date,
            current_date,
            interval '1 day'
        ) AS d(day)
        LEFT JOIN (
            SELECT r.created_at::date AS rday, count(*) AS c
            FROM public.survey_responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE s.user_id = p_user_id
              AND r.status = 'completed'
              AND r.created_at >= (current_date - interval '29 days')
            GROUP BY r.created_at::date
        ) cnt ON cnt.rday = d.day
    ) sub;

    -- Category breakdown: surveys and responses per category
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'category', sub.category,
            'count', sub.survey_count,
            'totalResponses', sub.total_responses
        ) ORDER BY sub.total_responses DESC
    ), '[]'::jsonb)
    INTO v_category_breakdown
    FROM (
        SELECT
            s.category,
            count(DISTINCT s.id) AS survey_count,
            count(r.id) FILTER (WHERE r.status = 'completed') AS total_responses
        FROM public.surveys s
        LEFT JOIN public.survey_responses r ON r.survey_id = s.id
        WHERE s.user_id = p_user_id AND s.status NOT IN ('draft', 'archived')
        GROUP BY s.category
    ) sub;

    -- Per-survey comparison metrics
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', sub.id,
            'title', sub.title,
            'status', sub.status,
            'category', sub.category,
            'completedCount', sub.completed_count,
            'completionRate', sub.completion_rate,
            'questionCount', sub.question_count,
            'createdAt', sub.created_at
        ) ORDER BY sub.completed_count DESC
    ), '[]'::jsonb)
    INTO v_survey_comparison
    FROM (
        SELECT
            s.id,
            s.title,
            s.status,
            s.category,
            s.created_at,
            COALESCE(cc.cnt, 0) AS completed_count,
            COALESCE(qc.cnt, 0) AS question_count,
            CASE WHEN COALESCE(tc.cnt, 0) > 0
                THEN round((COALESCE(cc.cnt, 0)::numeric / tc.cnt) * 100)::int
                ELSE 0
            END AS completion_rate
        FROM public.surveys s
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses WHERE status = 'completed'
            GROUP BY survey_id
        ) cc ON cc.survey_id = s.id
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            GROUP BY survey_id
        ) tc ON tc.survey_id = s.id
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_questions
            GROUP BY survey_id
        ) qc ON qc.survey_id = s.id
        WHERE s.user_id = p_user_id AND s.status NOT IN ('draft', 'archived')
    ) sub;

    RETURN jsonb_build_object(
        'responseTimeline', v_response_timeline,
        'totalResponses', v_total_responses,
        'completedResponses', v_completed_responses,
        'avgCompletionRate', v_avg_completion_rate,
        'categoryBreakdown', v_category_breakdown,
        'surveyComparison', v_survey_comparison
    );
END;
$$;


ALTER FUNCTION "public"."get_analytics_data"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_result jsonb;
    v_total_surveys int;
    v_active_surveys int;
    v_total_responses bigint;
    v_completed_responses bigint;
    v_avg_completion_rate int;
    v_response_timeline jsonb;
    v_top_surveys jsonb;
    v_recent_responses jsonb;
BEGIN
    -- Survey counts
    SELECT
        count(*) FILTER (WHERE status != 'archived'),
        count(*) FILTER (WHERE status = 'active')
    INTO v_total_surveys, v_active_surveys
    FROM public.surveys
    WHERE user_id = p_user_id;

    -- Response counts across all user surveys
    SELECT
        count(*),
        count(*) FILTER (WHERE r.status = 'completed')
    INTO v_total_responses, v_completed_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id;

    -- Average completion rate
    IF v_total_responses > 0 THEN
        v_avg_completion_rate := round((v_completed_responses::numeric / v_total_responses) * 100);
    ELSE
        v_avg_completion_rate := 0;
    END IF;

    -- 30-day response timeline across all surveys
    SELECT COALESCE(jsonb_agg(day_count ORDER BY day), '[]'::jsonb)
    INTO v_response_timeline
    FROM (
        SELECT d.day, COALESCE(cnt.c, 0) AS day_count
        FROM generate_series(
            (current_date - interval '29 days')::date,
            current_date,
            interval '1 day'
        ) AS d(day)
        LEFT JOIN (
            SELECT r.created_at::date AS rday, count(*) AS c
            FROM public.survey_responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE s.user_id = p_user_id
              AND r.status = 'completed'
              AND r.created_at >= (current_date - interval '29 days')
            GROUP BY r.created_at::date
        ) cnt ON cnt.rday = d.day
    ) sub;

    -- Top 5 surveys by completed responses
    SELECT COALESCE(jsonb_agg(row_data ORDER BY completed_count DESC), '[]'::jsonb)
    INTO v_top_surveys
    FROM (
        SELECT jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'status', s.status,
            'completedCount', COALESCE(cc.cnt, 0),
            'slug', s.slug
        ) AS row_data,
        COALESCE(cc.cnt, 0) AS completed_count
        FROM public.surveys s
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            WHERE status = 'completed'
            GROUP BY survey_id
        ) cc ON cc.survey_id = s.id
        WHERE s.user_id = p_user_id AND s.status != 'archived'
        ORDER BY COALESCE(cc.cnt, 0) DESC
        LIMIT 5
    ) sub;

    -- Latest 10 completed responses
    SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
    INTO v_recent_responses
    FROM (
        SELECT jsonb_build_object(
            'surveyId', s.id,
            'surveyTitle', s.title,
            'completedAt', r.completed_at,
            'feedback', r.feedback
        ) AS row_data
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id AND r.status = 'completed'
        ORDER BY r.completed_at DESC
        LIMIT 10
    ) sub;

    v_result := jsonb_build_object(
        'totalSurveys', v_total_surveys,
        'activeSurveys', v_active_surveys,
        'totalResponses', v_total_responses,
        'completedResponses', v_completed_responses,
        'avgCompletionRate', v_avg_completion_rate,
        'responseTimeline', v_response_timeline,
        'topSurveys', v_top_surveys,
        'recentResponses', v_recent_responses
    );

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_export_responses"("p_survey_id" "uuid", "p_user_id" "uuid") RETURNS TABLE("id" "uuid", "completed_at" timestamp with time zone, "contact_name" "text", "contact_email" "text", "feedback" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Verify the caller owns this survey
  IF NOT EXISTS (
    SELECT 1 FROM public.surveys
    WHERE surveys.id = p_survey_id AND surveys.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  RETURN QUERY
  SELECT
    sr.id,
    sr.completed_at,
    public.decrypt_pii(sr.contact_name_encrypted) AS contact_name,
    public.decrypt_pii(sr.contact_email_encrypted) AS contact_email,
    sr.feedback
  FROM public.survey_responses sr
  WHERE sr.survey_id = p_survey_id AND sr.status = 'completed'
  ORDER BY sr.completed_at;
END;
$$;


ALTER FUNCTION "public"."get_export_responses"("p_survey_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_statistics"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_total_surveys int;
    v_total_responses bigint;
    v_completed_responses bigint;
    v_avg_completion_rate int;
    v_member_since timestamptz;
BEGIN
    -- Count non-archived surveys
    SELECT count(*)
    INTO v_total_surveys
    FROM public.surveys
    WHERE user_id = p_user_id AND status != 'archived';

    -- Count responses across all user surveys
    SELECT
        count(*),
        count(*) FILTER (WHERE r.status = 'completed')
    INTO v_total_responses, v_completed_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id;

    -- Average completion rate
    IF v_total_responses > 0 THEN
        v_avg_completion_rate := round((v_completed_responses::numeric / v_total_responses) * 100);
    ELSE
        v_avg_completion_rate := 0;
    END IF;

    -- Member since from auth.users
    SELECT created_at INTO v_member_since
    FROM auth.users
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'totalSurveys', v_total_surveys,
        'totalResponses', v_total_responses,
        'avgCompletionRate', v_avg_completion_rate,
        'memberSince', v_member_since
    );
END;
$$;


ALTER FUNCTION "public"."get_profile_statistics"("p_user_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_survey_stats_data"("p_survey_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'survey', jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'slug', s.slug,
            'status', s.status,
            'startsAt', s.starts_at,
            'endsAt', s.ends_at,
            'maxRespondents', s.max_respondents
        ),
        'totalResponses', (
            SELECT count(*) FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'completed'
        ),
        'completedResponses', (
            SELECT count(*) FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'completed'
        ),
        'inProgressResponses', (
            SELECT count(*) FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'in_progress'
        ),
        -- NEW: 30-day daily response counts
        'responseTimeline', COALESCE((
            SELECT jsonb_agg(day_count ORDER BY day)
            FROM (
                SELECT d.day, COALESCE(cnt.c, 0) AS day_count
                FROM generate_series(
                    (current_date - interval '29 days')::date,
                    current_date,
                    interval '1 day'
                ) AS d(day)
                LEFT JOIN (
                    SELECT created_at::date AS rday, count(*) AS c
                    FROM public.survey_responses
                    WHERE survey_id = p_survey_id AND status = 'completed'
                      AND created_at >= (current_date - interval '29 days')
                    GROUP BY created_at::date
                ) cnt ON cnt.rday = d.day
            ) sub
        ), '[]'::jsonb),
        -- NEW: average completion time in seconds
        'avgCompletionSeconds', (
            SELECT EXTRACT(EPOCH FROM avg(completed_at - started_at))::int
            FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'completed' AND completed_at IS NOT NULL AND started_at IS NOT NULL
        ),
        -- NEW: first and last response timestamps
        'firstResponseAt', (
            SELECT min(created_at) FROM public.survey_responses WHERE survey_id = p_survey_id
        ),
        'lastResponseAt', (
            SELECT max(created_at) FROM public.survey_responses WHERE survey_id = p_survey_id
        ),
        'questions', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', q.id,
                    'text', q.text,
                    'type', q.type,
                    'sortOrder', q.sort_order,
                    'answers', COALESCE((
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'value', a.value,
                                'completedAt', r.completed_at
                            )
                        )
                        FROM public.survey_answers a
                        JOIN public.survey_responses r ON r.id = a.response_id
                        WHERE a.question_id = q.id AND r.status = 'completed'
                    ), '[]'::jsonb)
                ) ORDER BY q.sort_order
            )
            FROM public.survey_questions q
            WHERE q.survey_id = p_survey_id
        ), '[]'::jsonb)
    )
    INTO v_result
    FROM public.surveys s
    WHERE s.id = p_survey_id AND s.user_id = p_user_id;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_survey_stats_data"("p_survey_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_surveys_with_counts"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'title', s.title,
                'description', s.description,
                'category', s.category,
                'status', s.status,
                'slug', s.slug,
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
                'createdAt', s.created_at,
                'updatedAt', s.updated_at
            ) ORDER BY s.updated_at DESC
        )
        FROM public.surveys s

        -- Total response count
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            GROUP BY survey_id
        ) rc ON rc.survey_id = s.id

        -- Completed response count
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_responses
            WHERE status = 'completed'
            GROUP BY survey_id
        ) cc ON cc.survey_id = s.id

        -- Question count
        LEFT JOIN (
            SELECT survey_id, count(*) AS cnt
            FROM public.survey_questions
            GROUP BY survey_id
        ) qc ON qc.survey_id = s.id

        -- Most recent response timestamp
        LEFT JOIN (
            SELECT survey_id, max(created_at) AS last_at
            FROM public.survey_responses
            GROUP BY survey_id
        ) lr ON lr.survey_id = s.id

        -- 14-day daily activity (response counts per day, newest last)
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
                    WHERE survey_id = s.id
                      AND created_at >= (current_date - interval '13 days')
                    GROUP BY created_at::date
                ) cnt ON cnt.rday = d.day
            ) sub
        ) ra ON true

        WHERE s.user_id = p_user_id
    ), '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_user_surveys_with_counts"("p_user_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."save_survey_questions"("p_survey_id" "uuid", "p_user_id" "uuid", "p_questions" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Verify ownership
    IF NOT EXISTS (
        SELECT 1 FROM public.surveys
        WHERE id = p_survey_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Survey not found or access denied';
    END IF;

    -- Atomic delete + insert in single transaction
    DELETE FROM public.survey_questions WHERE survey_id = p_survey_id;

    INSERT INTO public.survey_questions (id, survey_id, text, type, required, description, config, sort_order)
    SELECT
        COALESCE((elem->>'id')::uuid, extensions.uuid_generate_v4()),
        p_survey_id,
        elem->>'text',
        (elem->>'type')::public.question_type,
        COALESCE((elem->>'required')::boolean, true),
        NULLIF(elem->>'description', ''),
        COALESCE(elem->'config', '{}'::jsonb),
        (elem->>'sortOrder')::integer
    FROM jsonb_array_elements(p_questions) AS elem;
END;
$$;


ALTER FUNCTION "public"."save_survey_questions"("p_survey_id" "uuid", "p_user_id" "uuid", "p_questions" "jsonb") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."start_survey_response"("p_survey_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_max integer;
  v_current integer;
  v_status text;
  v_response_id uuid;
BEGIN
  -- Lock the survey row to prevent concurrent inserts from exceeding the limit
  SELECT status, max_respondents
    INTO v_status, v_max
    FROM surveys
   WHERE id = p_survey_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SURVEY_NOT_FOUND';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
  END IF;

  IF v_max IS NOT NULL THEN
    SELECT count(*)
      INTO v_current
      FROM survey_responses
     WHERE survey_id = p_survey_id
       AND status IN ('in_progress', 'completed');

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'MAX_RESPONDENTS_REACHED';
    END IF;
  END IF;

  INSERT INTO survey_responses (survey_id)
  VALUES (p_survey_id)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;


ALTER FUNCTION "public"."start_survey_response"("p_survey_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text" DEFAULT NULL::"text", "p_contact_email" "text" DEFAULT NULL::"text", "p_feedback" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_survey_id uuid;
    v_status text;
BEGIN
    SELECT survey_id, status
      INTO v_survey_id, v_status
      FROM survey_responses
     WHERE id = p_response_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_status != 'in_progress' THEN
        RAISE EXCEPTION 'RESPONSE_ALREADY_COMPLETED';
    END IF;

    -- Empty submissions are allowed — they count as a completed response
    -- with 0% per-question response rate in analytics.

    UPDATE survey_responses
    SET status = 'completed',
        contact_name_encrypted = public.encrypt_pii(p_contact_name),
        contact_email_encrypted = public.encrypt_pii(p_contact_email),
        feedback = p_feedback,
        completed_at = now(),
        updated_at = now()
    WHERE id = p_response_id;
END;
$$;


ALTER FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text", "p_contact_email" "text", "p_feedback" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_and_save_answer"("p_response_id" "uuid", "p_question_id" "uuid", "p_value" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_question_type question_type;
    v_question_config jsonb;
    v_question_survey_id uuid;
    v_response_survey_id uuid;
    v_response_status text;
    v_rating int;
    v_text_value text;
    v_selected jsonb;
    v_max_length int;
    v_min_rating int;
    v_max_rating int;
    v_min_selections int;
    v_max_selections int;
BEGIN
    -- 1. Verify response exists and is in_progress
    SELECT survey_id, status
      INTO v_response_survey_id, v_response_status
      FROM survey_responses
     WHERE id = p_response_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_response_status != 'in_progress' THEN
        RAISE EXCEPTION 'RESPONSE_ALREADY_COMPLETED';
    END IF;

    -- 2. Get question metadata
    SELECT type, config, survey_id
      INTO v_question_type, v_question_config, v_question_survey_id
      FROM survey_questions
     WHERE id = p_question_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND';
    END IF;

    -- 3. Cross-survey ownership check
    IF v_question_survey_id != v_response_survey_id THEN
        RAISE EXCEPTION 'QUESTION_SURVEY_MISMATCH';
    END IF;

    -- 4. Type-specific validation (with safe coercion)
    CASE v_question_type
        WHEN 'rating_scale' THEN
            BEGIN
                v_rating := (p_value->>'rating')::int;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'RATING_INVALID_FORMAT';
            END;

            IF v_rating IS NULL THEN
                RAISE EXCEPTION 'RATING_REQUIRED';
            END IF;

            BEGIN
                v_min_rating := COALESCE((v_question_config->>'min')::int, 1);
                v_max_rating := COALESCE((v_question_config->>'max')::int, 5);
            EXCEPTION WHEN OTHERS THEN
                v_min_rating := 1;
                v_max_rating := 5;
            END;

            IF v_rating < v_min_rating OR v_rating > v_max_rating THEN
                RAISE EXCEPTION 'RATING_OUT_OF_BOUNDS';
            END IF;

        WHEN 'multiple_choice' THEN
            v_selected := p_value->'selected';

            IF v_selected IS NULL OR jsonb_typeof(v_selected) != 'array' THEN
                RAISE EXCEPTION 'SELECTED_MUST_BE_ARRAY';
            END IF;

            BEGIN
                v_max_selections := (v_question_config->>'maxSelections')::int;
                v_min_selections := (v_question_config->>'minSelections')::int;
            EXCEPTION WHEN OTHERS THEN
                v_max_selections := NULL;
                v_min_selections := NULL;
            END;

            IF v_max_selections IS NOT NULL AND jsonb_array_length(v_selected) > v_max_selections THEN
                RAISE EXCEPTION 'MAX_SELECTIONS_EXCEEDED';
            END IF;

            IF v_min_selections IS NOT NULL AND jsonb_array_length(v_selected) < v_min_selections THEN
                RAISE EXCEPTION 'MIN_SELECTIONS_NOT_MET';
            END IF;

            IF NOT COALESCE((v_question_config->>'allowOther')::boolean, false) THEN
                IF EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements_text(v_selected) AS sel
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements_text(v_question_config->'options') AS opt
                        WHERE opt = sel
                    )
                ) THEN
                    RAISE EXCEPTION 'INVALID_OPTION_SELECTED';
                END IF;
            END IF;

        WHEN 'yes_no' THEN
            IF p_value->>'answer' IS NULL
               OR (p_value->>'answer' != 'true' AND p_value->>'answer' != 'false') THEN
                RAISE EXCEPTION 'YES_NO_INVALID';
            END IF;

        WHEN 'open_text', 'short_text' THEN
            v_text_value := p_value->>'text';

            IF v_text_value IS NOT NULL THEN
                BEGIN
                    v_max_length := (v_question_config->>'maxLength')::int;
                EXCEPTION WHEN OTHERS THEN
                    v_max_length := NULL;
                END;

                IF v_max_length IS NOT NULL AND char_length(v_text_value) > v_max_length THEN
                    RAISE EXCEPTION 'TEXT_TOO_LONG';
                END IF;
            END IF;
    END CASE;

    -- 5. Upsert the validated answer
    INSERT INTO survey_answers (response_id, question_id, value)
    VALUES (p_response_id, p_question_id, p_value)
    ON CONFLICT (response_id, question_id)
    DO UPDATE SET value = EXCLUDED.value,
                  updated_at = now();
END;
$$;


ALTER FUNCTION "public"."validate_and_save_answer"("p_response_id" "uuid", "p_question_id" "uuid", "p_value" "jsonb") OWNER TO "postgres";


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
    "feedback" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "contact_name_encrypted" "bytea",
    "contact_email_encrypted" "bytea",
    CONSTRAINT "survey_responses_feedback_check" CHECK ((("feedback" IS NULL) OR ("char_length"("feedback") <= 2000))),
    CONSTRAINT "survey_responses_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text"])))
);

ALTER TABLE ONLY "public"."survey_responses" REPLICA IDENTITY FULL;


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
    "closed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "previous_status" "public"."survey_status",
    CONSTRAINT "surveys_dates_check" CHECK ((("ends_at" IS NULL) OR ("starts_at" IS NULL) OR ("ends_at" > "starts_at"))),
    CONSTRAINT "surveys_description_check" CHECK (("char_length"("description") <= 2000)),
    CONSTRAINT "surveys_max_respondents_check" CHECK ((("max_respondents" IS NULL) OR ("max_respondents" >= 1))),
    CONSTRAINT "surveys_slug_format_check" CHECK ((("slug" IS NULL) OR ("slug" ~ '^[A-Za-z0-9_-]{8,21}$'::"text"))),
    CONSTRAINT "surveys_title_check" CHECK (("char_length"("title") <= 100)),
    CONSTRAINT "surveys_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."surveys" OWNER TO "postgres";


ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_response_question_unique" UNIQUE ("response_id", "question_id");



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



ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."survey_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_answers"
    ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."survey_responses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_questions"
    ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."surveys"
    ADD CONSTRAINT "surveys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can create response for active survey" ON "public"."survey_responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_responses"."survey_id") AND ("surveys"."status" = 'active'::"public"."survey_status") AND ("surveys"."slug" IS NOT NULL)))));



CREATE POLICY "Anyone can insert answer for in-progress response" ON "public"."survey_answers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."survey_responses"
  WHERE (("survey_responses"."id" = "survey_answers"."response_id") AND ("survey_responses"."status" = 'in_progress'::"text")))));



CREATE POLICY "Anyone can read published surveys by slug" ON "public"."surveys" FOR SELECT USING ((("status" = ANY (ARRAY['active'::"public"."survey_status", 'pending'::"public"."survey_status", 'closed'::"public"."survey_status"])) AND ("slug" IS NOT NULL)));



CREATE POLICY "Anyone can read questions for published surveys" ON "public"."survey_questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."status" = ANY (ARRAY['active'::"public"."survey_status", 'pending'::"public"."survey_status", 'closed'::"public"."survey_status"])) AND ("surveys"."slug" IS NOT NULL)))));



CREATE POLICY "Anyone can read recently cancelled surveys by slug" ON "public"."surveys" FOR SELECT USING ((("status" = 'cancelled'::"public"."survey_status") AND ("slug" IS NOT NULL) AND ("cancelled_at" IS NOT NULL) AND ("cancelled_at" > ("now"() - '30 days'::interval))));



CREATE POLICY "Anyone can update answer for in-progress response" ON "public"."survey_answers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."survey_responses"
  WHERE (("survey_responses"."id" = "survey_answers"."response_id") AND ("survey_responses"."status" = 'in_progress'::"text")))));



CREATE POLICY "Anyone can update in-progress response" ON "public"."survey_responses" FOR UPDATE USING (("status" = 'in_progress'::"text")) WITH CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text"])));



CREATE POLICY "Owners can read answers for own surveys" ON "public"."survey_answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."survey_responses" "sr"
     JOIN "public"."surveys" "s" ON (("s"."id" = "sr"."survey_id")))
  WHERE (("sr"."id" = "survey_answers"."response_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Owners can read responses for own surveys" ON "public"."survey_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_responses"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



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


ALTER TABLE "public"."survey_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."surveys" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."survey_responses";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."cancel_email_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_email_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_pii"("encrypted" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_pii"("encrypted" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_pii"("plain_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_pii"("plain_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_analytics_data"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_analytics_data"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_email_change_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_email_change_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_export_responses"("p_survey_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_export_responses"("p_survey_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_statistics"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_statistics"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_survey_stats_data"("p_survey_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_survey_stats_data"("p_survey_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_surveys_with_counts"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_surveys_with_counts"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_password"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_clearing_required_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_clearing_required_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_clearing_required_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."save_survey_questions"("p_survey_id" "uuid", "p_user_id" "uuid", "p_questions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_survey_questions"("p_survey_id" "uuid", "p_user_id" "uuid", "p_questions" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."start_survey_response"("p_survey_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."start_survey_response"("p_survey_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_survey_response"("p_survey_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text", "p_contact_email" "text", "p_feedback" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text", "p_contact_email" "text", "p_feedback" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text", "p_contact_email" "text", "p_feedback" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_and_save_answer"("p_response_id" "uuid", "p_question_id" "uuid", "p_value" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_and_save_answer"("p_response_id" "uuid", "p_question_id" "uuid", "p_value" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_and_save_answer"("p_response_id" "uuid", "p_question_id" "uuid", "p_value" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_password"("current_plain_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_password"("current_plain_password" "text") TO "service_role";
























GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."survey_answers" TO "anon";
GRANT ALL ON TABLE "public"."survey_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_answers" TO "service_role";



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



