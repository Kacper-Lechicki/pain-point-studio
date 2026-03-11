


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






DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE "public"."question_type" AS ENUM (
        'open_text',
        'short_text',
        'multiple_choice',
        'rating_scale',
        'yes_no'
    );
  END IF;
END $$;
ALTER TYPE "public"."question_type" OWNER TO "postgres";


DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'survey_status') THEN
    CREATE TYPE "public"."survey_status" AS ENUM (
        'draft',
        'active',
        'completed',
        'cancelled',
        'archived',
        'trashed'
    );
  END IF;
END $$;
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


CREATE OR REPLACE FUNCTION "public"."change_project_status_with_cascade"("p_project_id" "uuid", "p_user_id" "uuid", "p_action" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_project RECORD;
  v_now TIMESTAMPTZ := now();
  v_new_status TEXT;
BEGIN
  -- ── 1. Fetch and lock the project ─────────────────────────────────
  SELECT status, pre_trash_status, pre_archive_status
    INTO v_project
    FROM public.projects
   WHERE id = p_project_id
     AND user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'projects.errors.unexpected');
  END IF;

  -- ── 2. Validate transition ────────────────────────────────────────
  CASE p_action
    WHEN 'complete' THEN
      IF v_project.status != 'active' THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    WHEN 'archive' THEN
      IF v_project.status NOT IN ('active', 'completed') THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    WHEN 'reopen' THEN
      IF v_project.status != 'completed' THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    WHEN 'restore' THEN
      IF v_project.status != 'archived' THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    WHEN 'trash' THEN
      IF v_project.status NOT IN ('active', 'completed', 'archived') THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    WHEN 'restoreTrash' THEN
      IF v_project.status != 'trashed' THEN
        RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
      END IF;
    ELSE
      RETURN jsonb_build_object('error', 'projects.errors.invalidTransition');
  END CASE;

  -- ── 3. Update the project ─────────────────────────────────────────
  CASE p_action
    WHEN 'complete' THEN
      UPDATE public.projects
         SET status = 'completed', completed_at = v_now
       WHERE id = p_project_id;

    WHEN 'archive' THEN
      UPDATE public.projects
         SET status = 'archived', archived_at = v_now, pre_archive_status = v_project.status
       WHERE id = p_project_id;

    WHEN 'reopen' THEN
      UPDATE public.projects
         SET status = 'active', completed_at = NULL
       WHERE id = p_project_id;

    WHEN 'restore' THEN
      v_new_status := COALESCE(v_project.pre_archive_status, 'active');
      UPDATE public.projects
         SET status = v_new_status, archived_at = NULL, pre_archive_status = NULL
       WHERE id = p_project_id;

    WHEN 'trash' THEN
      UPDATE public.projects
         SET status = 'trashed', deleted_at = v_now, pre_trash_status = v_project.status
       WHERE id = p_project_id;

    WHEN 'restoreTrash' THEN
      v_new_status := COALESCE(v_project.pre_trash_status, 'active');
      UPDATE public.projects
         SET status = v_new_status, deleted_at = NULL, pre_trash_status = NULL
       WHERE id = p_project_id;
  END CASE;

  -- ── 4. Cascade to surveys ─────────────────────────────────────────
  CASE p_action
    WHEN 'complete' THEN
      -- Auto-complete active surveys under this project
      UPDATE public.surveys
         SET status = 'completed',
             completed_at = v_now,
             updated_at = v_now
       WHERE project_id = p_project_id
         AND status = 'active';

    WHEN 'trash' THEN
      -- Trash all non-trashed surveys, saving each one's current status
      UPDATE public.surveys
         SET pre_trash_status = status,
             status = 'trashed',
             deleted_at = v_now
       WHERE project_id = p_project_id
         AND status != 'trashed';

    WHEN 'restoreTrash' THEN
      -- Restore trashed surveys to their pre_trash_status
      UPDATE public.surveys
         SET status = COALESCE(pre_trash_status, 'draft'),
             deleted_at = NULL,
             pre_trash_status = NULL
       WHERE project_id = p_project_id
         AND status = 'trashed';

    WHEN 'archive' THEN
      -- Archive active and draft surveys (save previous_status for restore)
      UPDATE public.surveys
         SET previous_status = status,
             status = 'archived',
             archived_at = v_now
       WHERE project_id = p_project_id
         AND status IN ('active', 'draft');

    WHEN 'restore' THEN
      -- Restore only cascade-archived surveys (those with previous_status set)
      UPDATE public.surveys
         SET status = COALESCE(previous_status, 'draft'),
             archived_at = NULL,
             previous_status = NULL
       WHERE project_id = p_project_id
         AND status = 'archived'
         AND previous_status IS NOT NULL;

    ELSE
      -- reopen: no cascade
      NULL;
  END CASE;

  RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."change_project_status_with_cascade"("p_project_id" "uuid", "p_user_id" "uuid", "p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_abandoned_responses"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    UPDATE public.survey_responses
    SET status = 'abandoned',
        updated_at = now()
    WHERE status = 'in_progress'
      AND started_at < now() - interval '24 hours';
END;
$$;


ALTER FUNCTION "public"."cleanup_abandoned_responses"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_expired_surveys"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    UPDATE public.surveys
    SET status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE status = 'active'
      AND ends_at IS NOT NULL
      AND ends_at <= now();
END;
$$;


ALTER FUNCTION "public"."complete_expired_surveys"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."find_user_by_email_excluding"("lookup_email" "text", "exclude_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT id FROM auth.users
  WHERE email = lookup_email AND id != exclude_id
  LIMIT 1;
$$;


ALTER FUNCTION "public"."find_user_by_email_excluding"("lookup_email" "text", "exclude_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") RETURNS "jsonb"
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


ALTER FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_period_start timestamptz;
    v_prev_start   timestamptz;
    v_total_responses      bigint;
    v_prev_total_responses bigint;
    v_active_surveys       int;
    v_prev_active_surveys  int;
    v_completed_current    bigint;
    v_total_current        bigint;
    v_completed_prev       bigint;
    v_total_prev           bigint;
    v_avg_completion_rate      int;
    v_prev_avg_completion_rate int;
    v_responses_timeline jsonb;
    v_completion_timeline jsonb;
    v_recent_activity    jsonb;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    IF p_days > 0 THEN
        v_period_start := now() - (p_days || ' days')::interval;
        v_prev_start   := v_period_start - (p_days || ' days')::interval;
    ELSE
        v_period_start := NULL;
        v_prev_start   := NULL;
    END IF;

    -- KPI: Total completed responses
    SELECT count(*)
    INTO v_total_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id
      AND r.status = 'completed'
      AND (v_period_start IS NULL OR r.completed_at >= v_period_start);

    IF v_prev_start IS NOT NULL THEN
        SELECT count(*)
        INTO v_prev_total_responses
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.status = 'completed'
          AND r.completed_at >= v_prev_start
          AND r.completed_at < v_period_start;
    ELSE
        v_prev_total_responses := NULL;
    END IF;

    -- KPI: Active surveys (current)
    SELECT count(*)::int
    INTO v_active_surveys
    FROM public.surveys
    WHERE user_id = p_user_id AND status = 'active';

    -- KPI: Active surveys in previous period
    IF v_prev_start IS NOT NULL THEN
        SELECT count(DISTINCT r.survey_id)::int
        INTO v_prev_active_surveys
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.status = 'completed'
          AND r.completed_at >= v_prev_start
          AND r.completed_at < v_period_start;
    ELSE
        v_prev_active_surveys := NULL;
    END IF;

    -- KPI: Avg completion rate
    SELECT
        count(*) FILTER (WHERE r.status = 'completed'),
        count(*)
    INTO v_completed_current, v_total_current
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id
      AND (v_period_start IS NULL OR r.created_at >= v_period_start);

    IF v_total_current > 0 THEN
        v_avg_completion_rate := round((v_completed_current::numeric / v_total_current) * 100);
    ELSE
        v_avg_completion_rate := 0;
    END IF;

    IF v_prev_start IS NOT NULL THEN
        SELECT
            count(*) FILTER (WHERE r.status = 'completed'),
            count(*)
        INTO v_completed_prev, v_total_prev
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.created_at >= v_prev_start
          AND r.created_at < v_period_start;

        IF v_total_prev > 0 THEN
            v_prev_avg_completion_rate := round((v_completed_prev::numeric / v_total_prev) * 100);
        ELSE
            v_prev_avg_completion_rate := 0;
        END IF;
    ELSE
        v_prev_avg_completion_rate := NULL;
    END IF;

    -- Chart: Responses over time (daily)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', d.day::text, 'count', COALESCE(cnt.c, 0))
        ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_responses_timeline
    FROM generate_series(
        COALESCE(v_period_start::date, (current_date - interval '29 days')::date),
        current_date,
        interval '1 day'
    ) AS d(day)
    LEFT JOIN (
        SELECT r.completed_at::date AS rday, count(*) AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.status = 'completed'
          AND r.completed_at IS NOT NULL
          AND r.completed_at >= COALESCE(v_period_start, '-infinity'::timestamptz)
        GROUP BY r.completed_at::date
    ) cnt ON cnt.rday = d.day;

    -- Chart: Completion timeline (3 series: completed, inProgress, abandoned)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'date', d.day::text,
            'completed', COALESCE(c.c, 0),
            'inProgress', COALESCE(ip.c, 0),
            'abandoned', COALESCE(a.c, 0)
        ) ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_completion_timeline
    FROM generate_series(
        COALESCE(v_period_start::date, (current_date - interval '29 days')::date),
        current_date,
        interval '1 day'
    ) AS d(day)
    LEFT JOIN (
        SELECT r.completed_at::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.status = 'completed'
          AND r.completed_at IS NOT NULL
          AND r.completed_at >= COALESCE(v_period_start, '-infinity'::timestamptz)
        GROUP BY r.completed_at::date
    ) c ON c.rday = d.day
    LEFT JOIN (
        SELECT r.created_at::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.status = 'in_progress'
          AND r.created_at >= COALESCE(v_period_start, '-infinity'::timestamptz)
        GROUP BY r.created_at::date
    ) ip ON ip.rday = d.day
    LEFT JOIN (
        SELECT (r.updated_at)::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.user_id = p_user_id
          AND r.status = 'abandoned'
          AND r.updated_at >= COALESCE(v_period_start, '-infinity'::timestamptz)
        GROUP BY (r.updated_at)::date
    ) a ON a.rday = d.day;

    -- Recent activity (last 5 events)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'type', sub.event_type,
            'title', sub.title,
            'timestamp', sub.event_ts,
            'surveyId', sub.survey_id
        )
        ORDER BY sub.event_ts DESC
    ), '[]'::jsonb)
    INTO v_recent_activity
    FROM (
        SELECT * FROM (
            SELECT
                'response'::text AS event_type,
                s.title,
                r.completed_at AS event_ts,
                s.id AS survey_id
            FROM public.survey_responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE s.user_id = p_user_id
              AND r.status = 'completed'
              AND r.completed_at IS NOT NULL
            ORDER BY r.completed_at DESC
            LIMIT 5
        ) t1
        UNION ALL
        SELECT * FROM (
            SELECT
                'survey_completed'::text AS event_type,
                s.title,
                s.completed_at AS event_ts,
                s.id AS survey_id
            FROM public.surveys s
            WHERE s.user_id = p_user_id
              AND s.completed_at IS NOT NULL
            ORDER BY s.completed_at DESC
            LIMIT 3
        ) t2
        UNION ALL
        SELECT * FROM (
            SELECT
                'survey_activated'::text AS event_type,
                s.title,
                COALESCE(s.starts_at, s.created_at) AS event_ts,
                s.id AS survey_id
            FROM public.surveys s
            WHERE s.user_id = p_user_id
              AND s.status = 'active'
            ORDER BY COALESCE(s.starts_at, s.created_at) DESC
            LIMIT 3
        ) t3
    ) sub;

    RETURN jsonb_build_object(
        'totalResponses',         v_total_responses,
        'prevTotalResponses',     v_prev_total_responses,
        'activeSurveys',          v_active_surveys,
        'prevActiveSurveys',     v_prev_active_surveys,
        'avgCompletionRate',      v_avg_completion_rate,
        'prevAvgCompletionRate',  v_prev_avg_completion_rate,
        'responsesTimeline',      v_responses_timeline,
        'completionTimeline',     v_completion_timeline,
        'recentActivity',         v_recent_activity
    );
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" integer) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_project_detail_stats"("p_project_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_total_surveys         int;
    v_active_surveys        int;
    v_total_responses       bigint;
    v_completed_responses   bigint;
    v_total_all_responses   bigint;
    v_avg_completion        int;
    v_avg_time_seconds      int;
    v_last_response_at      timestamptz;
    v_responses_timeline    jsonb;
    v_completion_timeline   jsonb;
    v_status_distribution   jsonb;
    v_completion_breakdown  jsonb;
    v_recent_activity       jsonb;
    v_since                 date := (current_date - interval '89 days')::date;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p_project_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'NOT_FOUND';
    END IF;

    -- ── KPI: Total surveys in project ────────────────────────
    SELECT count(*)::int INTO v_total_surveys
    FROM public.surveys
    WHERE project_id = p_project_id AND user_id = p_user_id;

    -- ── KPI: Active surveys ──────────────────────────────────
    SELECT count(*)::int INTO v_active_surveys
    FROM public.surveys
    WHERE project_id = p_project_id AND user_id = p_user_id AND status = 'active';

    -- ── KPI: Total completed responses ───────────────────────
    SELECT count(*) INTO v_total_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id AND r.status = 'completed';

    -- ── KPI: Avg completion rate ─────────────────────────────
    SELECT count(*) FILTER (WHERE r.status = 'completed'), count(*)
    INTO v_completed_responses, v_total_all_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id;

    IF v_total_all_responses > 0 THEN
        v_avg_completion := round((v_completed_responses::numeric / v_total_all_responses) * 100);
    ELSE
        v_avg_completion := 0;
    END IF;

    -- ── KPI: Avg completion time (seconds) ───────────────────
    SELECT round(extract(epoch FROM avg(r.updated_at - r.created_at)))::int
    INTO v_avg_time_seconds
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id AND r.status = 'completed';

    -- ── KPI: Last response at ────────────────────────────────
    SELECT max(r.created_at)
    INTO v_last_response_at
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id;

    -- ── Chart: Responses timeline (last 90 days) ─────────────
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', d.day, 'count', COALESCE(c.cnt, 0))
        ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_responses_timeline
    FROM generate_series(v_since, current_date, '1 day') AS d(day)
    LEFT JOIN (
        SELECT (r.created_at)::date AS rday, count(*)::int AS cnt
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.created_at >= v_since
        GROUP BY (r.created_at)::date
    ) c ON c.rday = d.day;

    -- ── Chart: Completion timeline (last 90 days) ────────────
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'date', d.day,
            'completed', COALESCE(comp.c, 0),
            'inProgress', COALESCE(ip.c, 0),
            'abandoned', COALESCE(a.c, 0)
        ) ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_completion_timeline
    FROM generate_series(v_since, current_date, '1 day') AS d(day)
    LEFT JOIN (
        SELECT (r.updated_at)::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.status = 'completed'
          AND r.updated_at >= v_since
        GROUP BY (r.updated_at)::date
    ) comp ON comp.rday = d.day
    LEFT JOIN (
        SELECT (r.updated_at)::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.status = 'in_progress'
          AND r.updated_at >= v_since
        GROUP BY (r.updated_at)::date
    ) ip ON ip.rday = d.day
    LEFT JOIN (
        SELECT (r.updated_at)::date AS rday, count(*)::int AS c
        FROM public.survey_responses r
        JOIN public.surveys s ON s.id = r.survey_id
        WHERE s.project_id = p_project_id AND s.user_id = p_user_id
          AND r.status = 'abandoned'
          AND r.updated_at >= v_since
        GROUP BY (r.updated_at)::date
    ) a ON a.rday = d.day;

    -- ── Chart: Survey status distribution ────────────────────
    SELECT jsonb_build_object(
        'draft',     count(*) FILTER (WHERE status = 'draft'),
        'active',    count(*) FILTER (WHERE status = 'active'),
        'completed', count(*) FILTER (WHERE status = 'completed'),
        'cancelled', count(*) FILTER (WHERE status = 'cancelled'),
        'archived',  count(*) FILTER (WHERE status = 'archived')
    )
    INTO v_status_distribution
    FROM public.surveys
    WHERE project_id = p_project_id AND user_id = p_user_id;

    -- ── Chart: Completion breakdown (aggregate) ──────────────
    SELECT jsonb_build_object(
        'completed',  count(*) FILTER (WHERE r.status = 'completed'),
        'inProgress', count(*) FILTER (WHERE r.status = 'in_progress'),
        'abandoned',  count(*) FILTER (WHERE r.status = 'abandoned')
    )
    INTO v_completion_breakdown
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.project_id = p_project_id AND s.user_id = p_user_id;

    -- ── Recent activity (last 5 events) ──────────────────────
    SELECT COALESCE(jsonb_agg(sub.evt ORDER BY sub.ts DESC), '[]'::jsonb)
    INTO v_recent_activity
    FROM (
        (
            SELECT jsonb_build_object(
                'type', 'response',
                'title', s.title,
                'timestamp', r.created_at,
                'surveyId', s.id
            ) AS evt, r.created_at AS ts
            FROM public.survey_responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE s.project_id = p_project_id AND s.user_id = p_user_id
            ORDER BY r.created_at DESC LIMIT 3
        )
        UNION ALL
        (
            SELECT jsonb_build_object(
                'type', 'survey_started',
                'title', s.title,
                'timestamp', COALESCE(s.starts_at, s.created_at),
                'surveyId', s.id
            ) AS evt, COALESCE(s.starts_at, s.created_at) AS ts
            FROM public.surveys s
            WHERE s.project_id = p_project_id AND s.user_id = p_user_id AND s.status = 'active'
            ORDER BY COALESCE(s.starts_at, s.created_at) DESC LIMIT 3
        )
    ) sub;

    RETURN jsonb_build_object(
        'totalSurveys',            v_total_surveys,
        'activeSurveys',           v_active_surveys,
        'totalResponses',          v_total_responses,
        'avgCompletion',           v_avg_completion,
        'avgTimeSeconds',           v_avg_time_seconds,
        'lastResponseAt',           v_last_response_at,
        'responsesTimeline',       v_responses_timeline,
        'completionTimeline',      v_completion_timeline,
        'surveyStatusDistribution', v_status_distribution,
        'completionBreakdown',     v_completion_breakdown,
        'recentActivity',          v_recent_activity
    );
END;
$$;


ALTER FUNCTION "public"."get_project_detail_stats"("p_project_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_project_surveys_with_counts"("p_user_id" "uuid", "p_project_id" "uuid") RETURNS "jsonb"
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


ALTER FUNCTION "public"."get_project_surveys_with_counts"("p_user_id" "uuid", "p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Auth check: caller must be the user
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    SELECT COALESCE(jsonb_object_agg(proj.id::text, jsonb_build_object(
        'draftCount',     COALESCE(sc.draft_count, 0),
        'activeCount',    COALESCE(sc.active_count, 0),
        'completedCount', COALESCE(sc.completed_count, 0),
        'nearestEndsAt',  sc.nearest_ends_at,
        'sparkline',      COALESCE(sp.points, '[]'::jsonb)
    )), '{}'::jsonb)
    INTO v_result
    FROM public.projects proj

    -- Survey status counts + nearest ends_at per project
    LEFT JOIN LATERAL (
        SELECT
            count(*) FILTER (WHERE s.status = 'draft')::int     AS draft_count,
            count(*) FILTER (WHERE s.status = 'active')::int    AS active_count,
            count(*) FILTER (WHERE s.status = 'completed')::int AS completed_count,
            min(s.ends_at) FILTER (WHERE s.status = 'active' AND s.ends_at IS NOT NULL)
                AS nearest_ends_at
        FROM public.surveys s
        WHERE s.project_id = proj.id AND s.user_id = p_user_id
    ) sc ON true

    -- 14-day sparkline: daily completed response counts per project
    LEFT JOIN LATERAL (
        SELECT jsonb_agg(
            jsonb_build_object('date', d.day::text, 'count', COALESCE(cnt.c, 0))
            ORDER BY d.day
        ) AS points
        FROM generate_series(
            (current_date - interval '13 days')::date,
            current_date,
            interval '1 day'
        ) AS d(day)
        LEFT JOIN (
            SELECT r.completed_at::date AS rday, count(*)::int AS c
            FROM public.survey_responses r
            JOIN public.surveys s ON s.id = r.survey_id
            WHERE s.project_id = proj.id
              AND s.user_id = p_user_id
              AND r.status = 'completed'
              AND r.completed_at IS NOT NULL
              AND r.completed_at >= (current_date - interval '13 days')
            GROUP BY r.completed_at::date
        ) cnt ON cnt.rday = d.day
    ) sp ON true

    WHERE proj.user_id = p_user_id;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_research_journey"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_member_since      timestamptz;
  v_first_project_at  timestamptz;
  v_first_survey_at   timestamptz;
  v_first_response_at timestamptz;
  v_total_responses   bigint;
BEGIN
  -- Ownership check: caller must be the requested user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  -- When the user joined
  SELECT created_at INTO v_member_since
  FROM auth.users
  WHERE id = p_user_id;

  -- When the user created their first project
  SELECT MIN(created_at) INTO v_first_project_at
  FROM public.projects
  WHERE user_id = p_user_id;

  -- When the user first published a survey (active or completed)
  SELECT MIN(COALESCE(starts_at, created_at)) INTO v_first_survey_at
  FROM public.surveys
  WHERE user_id = p_user_id
    AND status IN ('active', 'completed');

  -- When the user received their first completed response
  SELECT MIN(r.completed_at) INTO v_first_response_at
  FROM public.survey_responses r
  JOIN public.surveys s ON s.id = r.survey_id
  WHERE s.user_id = p_user_id
    AND r.status = 'completed';

  -- Total completed responses across all surveys
  SELECT COUNT(*) INTO v_total_responses
  FROM public.survey_responses r
  JOIN public.surveys s ON s.id = r.survey_id
  WHERE s.user_id = p_user_id
    AND r.status = 'completed';

  RETURN jsonb_build_object(
    'memberSince',     v_member_since,
    'firstProjectAt',  v_first_project_at,
    'firstSurveyAt',   v_first_survey_at,
    'firstResponseAt', v_first_response_at,
    'totalResponses',  v_total_responses
  );
END;
$$;


ALTER FUNCTION "public"."get_research_journey"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_response_detail"("p_response_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_survey_id uuid;
  v_result    jsonb;
BEGIN
  -- Look up the survey for this response and verify ownership
  SELECT sr.survey_id INTO v_survey_id
  FROM public.survey_responses sr
  JOIN public.surveys s ON s.id = sr.survey_id
  WHERE sr.id = p_response_id AND s.user_id = p_user_id;

  IF v_survey_id IS NULL THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  SELECT jsonb_build_object(
    'id',              sr.id,
    'status',          sr.status,
    'startedAt',       sr.started_at,
    'completedAt',     sr.completed_at,
    'deviceType',      sr.device_type,
    'durationSeconds', CASE
      WHEN sr.completed_at IS NOT NULL AND sr.started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM sr.completed_at - sr.started_at)::integer
      ELSE NULL
    END,
    'contactName',     public.decrypt_pii(sr.contact_name_encrypted),
    'contactEmail',    public.decrypt_pii(sr.contact_email_encrypted),
    'feedback',        sr.feedback,
    'answers',         COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'questionId',     sq.id,
          'questionText',   sq.text,
          'questionType',   sq.type,
          'questionConfig', sq.config,
          'sortOrder',      sq.sort_order,
          'value',          sa.value
        )
        ORDER BY sq.sort_order
      )
      FROM public.survey_answers sa
      JOIN public.survey_questions sq ON sq.id = sa.question_id
      WHERE sa.response_id = sr.id),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM public.survey_responses sr
  WHERE sr.id = p_response_id;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_response_detail"("p_response_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_survey_completion_timeline"("p_survey_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_timeline_start date;
    v_result jsonb;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    SELECT GREATEST(
        COALESCE(s.starts_at::date, (current_date - interval '29 days')::date),
        (current_date - interval '29 days')::date
    )
    INTO v_timeline_start
    FROM public.surveys s
    WHERE s.id = p_survey_id AND s.user_id = p_user_id;

    IF v_timeline_start IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'date', d.day::text,
            'completed', COALESCE(c.c, 0),
            'inProgress', COALESCE(ip.c, 0),
            'abandoned', COALESCE(a.c, 0)
        ) ORDER BY d.day
    ), '[]'::jsonb)
    INTO v_result
    FROM generate_series(v_timeline_start, current_date, interval '1 day') AS d(day)
    LEFT JOIN (
        SELECT completed_at::date AS rday, count(*)::int AS c
        FROM public.survey_responses
        WHERE survey_id = p_survey_id AND status = 'completed' AND completed_at IS NOT NULL
          AND completed_at >= v_timeline_start
        GROUP BY completed_at::date
    ) c ON c.rday = d.day
    LEFT JOIN (
        SELECT created_at::date AS rday, count(*)::int AS c
        FROM public.survey_responses
        WHERE survey_id = p_survey_id AND status = 'in_progress'
          AND created_at >= v_timeline_start
        GROUP BY created_at::date
    ) ip ON ip.rday = d.day
    LEFT JOIN (
        SELECT (updated_at)::date AS rday, count(*)::int AS c
        FROM public.survey_responses
        WHERE survey_id = p_survey_id AND status = 'abandoned'
          AND updated_at >= v_timeline_start
        GROUP BY (updated_at)::date
    ) a ON a.rday = d.day;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_survey_completion_timeline"("p_survey_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT COALESCE(COUNT(*)::integer, 0)
    FROM public.survey_responses
    WHERE survey_id = p_survey_id
      AND status = 'completed'
      AND submitted_after_close = false;
$$;


ALTER FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_survey_responses_list"("p_survey_id" "uuid", "p_user_id" "uuid", "p_page" integer DEFAULT 1, "p_per_page" integer DEFAULT 20, "p_status" "text" DEFAULT NULL::"text", "p_device" "text" DEFAULT NULL::"text", "p_has_contact" boolean DEFAULT NULL::boolean, "p_search" "text" DEFAULT NULL::"text", "p_sort_by" "text" DEFAULT 'completed_at'::"text", "p_sort_dir" "text" DEFAULT 'desc'::"text", "p_date_from" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_date_to" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_offset     integer;
  v_result     jsonb;
BEGIN
  -- Verify the caller owns this survey
  IF NOT EXISTS (
    SELECT 1 FROM public.surveys
    WHERE surveys.id = p_survey_id AND surveys.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  -- Clamp pagination
  IF p_page < 1 THEN p_page := 1; END IF;
  IF p_per_page < 1 THEN p_per_page := 20; END IF;
  IF p_per_page > 100 THEN p_per_page := 100; END IF;

  v_offset := (p_page - 1) * p_per_page;

  WITH filtered AS (
    SELECT
      sr.id,
      sr.status,
      sr.started_at,
      sr.completed_at,
      sr.device_type,
      CASE
        WHEN sr.completed_at IS NOT NULL AND sr.started_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM sr.completed_at - sr.started_at)::integer
        ELSE NULL
      END AS duration_seconds,
      public.decrypt_pii(sr.contact_name_encrypted) AS contact_name,
      public.decrypt_pii(sr.contact_email_encrypted) AS contact_email,
      (SELECT count(*)::integer FROM public.survey_answers sa WHERE sa.response_id = sr.id) AS answer_count,
      sr.feedback
    FROM public.survey_responses sr
    WHERE sr.survey_id = p_survey_id
      AND (p_status IS NULL OR sr.status = p_status)
      AND (p_device IS NULL OR sr.device_type = p_device)
      AND (
        p_has_contact IS NULL
        OR (p_has_contact = true AND sr.contact_email_encrypted IS NOT NULL)
        OR (p_has_contact = false AND sr.contact_email_encrypted IS NULL)
      )
      AND (p_date_from IS NULL OR sr.started_at >= p_date_from)
      AND (p_date_to IS NULL OR sr.started_at <= p_date_to)
  ),
  searched AS (
    SELECT f.*
    FROM filtered f
    WHERE p_search IS NULL
       OR f.contact_name ILIKE '%' || p_search || '%'
       OR f.contact_email ILIKE '%' || p_search || '%'
  ),
  total AS (
    SELECT count(*)::integer AS cnt FROM searched
  ),
  sorted AS (
    SELECT s.*
    FROM searched s
    ORDER BY
      CASE WHEN p_sort_by = 'completed_at' AND p_sort_dir = 'desc' THEN s.completed_at END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'completed_at' AND p_sort_dir = 'asc'  THEN s.completed_at END ASC  NULLS LAST,
      CASE WHEN p_sort_by = 'started_at'   AND p_sort_dir = 'desc' THEN s.started_at   END DESC,
      CASE WHEN p_sort_by = 'started_at'   AND p_sort_dir = 'asc'  THEN s.started_at   END ASC,
      CASE WHEN p_sort_by = 'duration'     AND p_sort_dir = 'desc' THEN s.duration_seconds END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'duration'     AND p_sort_dir = 'asc'  THEN s.duration_seconds END ASC  NULLS LAST,
      s.started_at DESC  -- fallback
    LIMIT p_per_page OFFSET v_offset
  )
  SELECT jsonb_build_object(
    'totalCount', (SELECT cnt FROM total),
    'items', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id',              s.id,
          'status',          s.status,
          'startedAt',       s.started_at,
          'completedAt',     s.completed_at,
          'deviceType',      s.device_type,
          'durationSeconds', s.duration_seconds,
          'contactName',     s.contact_name,
          'contactEmail',    s.contact_email,
          'answerCount',     s.answer_count,
          'feedback',        s.feedback
        )
       )
       FROM sorted s),
      '[]'::jsonb
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_survey_responses_list"("p_survey_id" "uuid", "p_user_id" "uuid", "p_page" integer, "p_per_page" integer, "p_status" "text", "p_device" "text", "p_has_contact" boolean, "p_search" "text", "p_sort_by" "text", "p_sort_dir" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_survey_stats_data"("p_survey_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_result jsonb;
    v_timeline_start date;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    SELECT GREATEST(
        COALESCE(s.starts_at::date, (current_date - interval '29 days')::date),
        (current_date - interval '29 days')::date
    )
    INTO v_timeline_start
    FROM public.surveys s
    WHERE s.id = p_survey_id AND s.user_id = p_user_id;

    IF v_timeline_start IS NULL THEN
        RETURN NULL;
    END IF;

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
        'viewCount', s.view_count,
        'totalResponses', (
            SELECT count(*) FROM public.survey_responses
            WHERE survey_id = p_survey_id
        ),
        'completedResponses', (
            SELECT count(*) FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'completed'
        ),
        'inProgressResponses', (
            SELECT count(*) FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'in_progress'
        ),
        'responseTimeline', COALESCE((
            SELECT jsonb_agg(day_count ORDER BY day)
            FROM (
                SELECT d.day, COALESCE(cnt.c, 0) AS day_count
                FROM generate_series(
                    v_timeline_start,
                    current_date,
                    interval '1 day'
                ) AS d(day)
                LEFT JOIN (
                    SELECT created_at::date AS rday, count(*) AS c
                    FROM public.survey_responses
                    WHERE survey_id = p_survey_id AND status = 'completed'
                      AND created_at >= v_timeline_start
                    GROUP BY created_at::date
                ) cnt ON cnt.rday = d.day
            ) sub
        ), '[]'::jsonb),
        'avgCompletionSeconds', (
            SELECT EXTRACT(EPOCH FROM avg(completed_at - started_at))::int
            FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'completed' AND completed_at IS NOT NULL AND started_at IS NOT NULL
        ),
        'firstResponseAt', (
            SELECT min(completed_at) FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'completed'
        ),
        'lastResponseAt', (
            SELECT max(completed_at) FROM public.survey_responses
            WHERE survey_id = p_survey_id AND status = 'completed'
        ),
        'deviceTimeline', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'desktop', COALESCE(cnt.desktop, 0),
                    'mobile', COALESCE(cnt.mobile, 0)
                ) ORDER BY d.day
            )
            FROM generate_series(
                v_timeline_start,
                current_date,
                interval '1 day'
            ) AS d(day)
            LEFT JOIN (
                SELECT
                    created_at::date AS rday,
                    count(*) FILTER (WHERE device_type = 'desktop' OR device_type IS NULL) AS desktop,
                    count(*) FILTER (WHERE device_type IN ('mobile', 'tablet')) AS mobile
                FROM public.survey_responses
                WHERE survey_id = p_survey_id AND status = 'completed'
                  AND created_at >= v_timeline_start
                GROUP BY created_at::date
            ) cnt ON cnt.rday = d.day
        ), '[]'::jsonb),
        'questions', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', q.id,
                    'text', q.text,
                    'type', q.type,
                    'sortOrder', q.sort_order,
                    'config', COALESCE(q.config, '{}'::jsonb),
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


CREATE OR REPLACE FUNCTION "public"."get_user_id_by_email"("lookup_email" "text") RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT id FROM auth.users WHERE email = lookup_email LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_id_by_email"("lookup_email" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."merge_user_data"("from_user_id" "uuid", "to_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Validate inputs
  IF from_user_id = to_user_id THEN
    RAISE EXCEPTION 'Cannot merge a user into themselves';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = from_user_id) THEN
    RAISE EXCEPTION 'Source user % does not exist', from_user_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = to_user_id) THEN
    RAISE EXCEPTION 'Target user % does not exist', to_user_id;
  END IF;

  -- 1. Projects: handle unique constraint on (user_id, lower(name))
  --    Rename conflicting source projects before reassigning.
  UPDATE public.projects
  SET name = name || ' (merged)'
  WHERE user_id = from_user_id
    AND lower(name) IN (
      SELECT lower(p2.name) FROM public.projects p2 WHERE p2.user_id = to_user_id
    );

  UPDATE public.projects
  SET user_id = to_user_id
  WHERE user_id = from_user_id;

  -- 2. Surveys
  UPDATE public.surveys
  SET user_id = to_user_id
  WHERE user_id = from_user_id;

  -- 3. Project notes
  UPDATE public.project_notes
  SET user_id = to_user_id
  WHERE user_id = from_user_id;

  -- 4. Project note folders
  UPDATE public.project_note_folders
  SET user_id = to_user_id
  WHERE user_id = from_user_id;

  -- 5. Merge profile data: fill empty target fields from source
  UPDATE public.profiles AS target
  SET
    avatar_url  = CASE WHEN target.avatar_url = '' THEN source.avatar_url ELSE target.avatar_url END,
    bio         = CASE WHEN target.bio = ''         THEN source.bio         ELSE target.bio END,
    full_name   = CASE WHEN target.full_name = ''   THEN source.full_name   ELSE target.full_name END,
    role        = CASE WHEN target.role IS NULL      THEN source.role        ELSE target.role END
  FROM public.profiles AS source
  WHERE target.id = to_user_id AND source.id = from_user_id;

  -- 6. Delete source profile (will also cascade when auth.users row is deleted,
  --    but we do it explicitly so the caller can safely delete the auth user next).
  DELETE FROM public.profiles WHERE id = from_user_id;
END;
$$;


ALTER FUNCTION "public"."merge_user_data"("from_user_id" "uuid", "to_user_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."purge_trashed_projects"() RETURNS "void"
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


CREATE OR REPLACE FUNCTION "public"."purge_trashed_surveys"() RETURNS "void"
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


CREATE OR REPLACE FUNCTION "public"."record_survey_view"("p_survey_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE public.surveys
     SET view_count = view_count + 1
   WHERE id = p_survey_id
     AND status = 'active';
END;
$$;


ALTER FUNCTION "public"."record_survey_view"("p_survey_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_max integer;
  v_current integer;
  v_status text;
  v_response_id uuid;
BEGIN
  SELECT status, max_respondents
    INTO v_status, v_max
    FROM public.surveys
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
      FROM public.survey_responses
     WHERE survey_id = p_survey_id
       AND (
         status = 'completed'
         OR (status = 'in_progress' AND started_at > now() - interval '24 hours')
       );

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'MAX_RESPONDENTS_REACHED';
    END IF;
  END IF;

  INSERT INTO public.survey_responses (survey_id, device_type)
  VALUES (p_survey_id, p_device_type)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;


ALTER FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text" DEFAULT NULL::"text", "p_fingerprint" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_max integer;
  v_current integer;
  v_status text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_response_id uuid;
  v_existing_count integer;
BEGIN
  SELECT status, max_respondents, starts_at, ends_at
    INTO v_status, v_max, v_starts_at, v_ends_at
    FROM public.surveys
   WHERE id = p_survey_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SURVEY_NOT_FOUND';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
  END IF;

  -- Enforce time bounds even when cron hasn't updated the status yet.
  IF v_starts_at IS NOT NULL AND v_starts_at > now() THEN
    RAISE EXCEPTION 'SURVEY_NOT_STARTED';
  END IF;

  IF v_ends_at IS NOT NULL AND v_ends_at < now() THEN
    RAISE EXCEPTION 'SURVEY_EXPIRED';
  END IF;

  -- Deduplication: warn if this fingerprint already has a completed response.
  IF p_fingerprint IS NOT NULL THEN
    SELECT count(*)
      INTO v_existing_count
      FROM public.survey_responses
     WHERE survey_id = p_survey_id
       AND fingerprint = p_fingerprint
       AND status = 'completed';

    IF v_existing_count > 0 THEN
      RAISE EXCEPTION 'DUPLICATE_RESPONSE';
    END IF;
  END IF;

  IF v_max IS NOT NULL THEN
    SELECT count(*)
      INTO v_current
      FROM public.survey_responses
     WHERE survey_id = p_survey_id
       AND (
         status = 'completed'
         OR (status = 'in_progress' AND started_at > now() - interval '24 hours')
       )
       AND submitted_after_close = false;

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'MAX_RESPONDENTS_REACHED';
    END IF;
  END IF;

  INSERT INTO public.survey_responses (survey_id, device_type, fingerprint)
  VALUES (p_survey_id, p_device_type, p_fingerprint)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;


ALTER FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text", "p_fingerprint" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text" DEFAULT NULL::"text", "p_contact_email" "text" DEFAULT NULL::"text", "p_feedback" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_survey_id uuid;
    v_status text;
    v_survey_status text;
    v_max integer;
    v_completed integer;
    v_ends_at timestamptz;
    v_is_late boolean := false;
BEGIN
    SELECT survey_id, status
      INTO v_survey_id, v_status
      FROM public.survey_responses
     WHERE id = p_response_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_status != 'in_progress' THEN
        RAISE EXCEPTION 'RESPONSE_ALREADY_COMPLETED';
    END IF;

    -- Check parent survey status — block if not active
    SELECT status, ends_at
      INTO v_survey_status, v_ends_at
      FROM public.surveys
     WHERE id = v_survey_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SURVEY_NOT_FOUND';
    END IF;

    IF v_survey_status <> 'active' THEN
        RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
    END IF;

    -- Flag if the survey's time window has passed (active but expired, before cron runs)
    IF v_ends_at IS NOT NULL AND v_ends_at < now() THEN
        v_is_late := true;
    END IF;

    UPDATE public.survey_responses
    SET status = 'completed',
        contact_name_encrypted = public.encrypt_pii(p_contact_name),
        contact_email_encrypted = public.encrypt_pii(p_contact_email),
        feedback = p_feedback,
        completed_at = now(),
        updated_at = now(),
        submitted_after_close = v_is_late
    WHERE id = p_response_id;

    -- Only count non-late responses toward max_respondents auto-complete.
    IF NOT v_is_late THEN
        SELECT max_respondents
          INTO v_max
          FROM public.surveys
         WHERE id = v_survey_id;

        IF v_max IS NOT NULL THEN
            SELECT count(*)
              INTO v_completed
              FROM public.survey_responses
             WHERE survey_id = v_survey_id
               AND status = 'completed'
               AND submitted_after_close = false;

            IF v_completed >= v_max THEN
                UPDATE public.surveys
                SET status = 'completed',
                    completed_at = now(),
                    updated_at = now()
                WHERE id = v_survey_id
                  AND status = 'active';
            END IF;
        END IF;
    END IF;
END;
$$;


ALTER FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text", "p_contact_email" "text", "p_feedback" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_and_save_answer"("p_response_id" "uuid", "p_question_id" "uuid", "p_value" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_question_type public.question_type;
    v_question_config jsonb;
    v_question_survey_id uuid;
    v_response_survey_id uuid;
    v_response_status text;
    v_survey_status text;
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
      FROM public.survey_responses
     WHERE id = p_response_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_response_status != 'in_progress' THEN
        RAISE EXCEPTION 'RESPONSE_ALREADY_COMPLETED';
    END IF;

    -- 1b. Check parent survey status — block if not active
    SELECT status INTO v_survey_status
      FROM public.surveys
     WHERE id = v_response_survey_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SURVEY_NOT_FOUND';
    END IF;

    IF v_survey_status <> 'active' THEN
        RAISE EXCEPTION 'SURVEY_NOT_ACTIVE';
    END IF;

    -- 2. Get question metadata
    SELECT type, config, survey_id
      INTO v_question_type, v_question_config, v_question_survey_id
      FROM public.survey_questions
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
    INSERT INTO public.survey_answers (response_id, question_id, value)
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


CREATE TABLE IF NOT EXISTS "public"."insight_suggestion_actions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "signature" "text" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "insight_suggestion_actions_action_check" CHECK (("action" = ANY (ARRAY['accepted'::"text", 'dismissed'::"text"]))),
    CONSTRAINT "insight_suggestion_actions_signature_length_check" CHECK (("char_length"("signature") <= 500))
);


ALTER TABLE "public"."insight_suggestion_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "role" "text",
    "bio" "text" DEFAULT ''::"text" NOT NULL,
    "avatar_url" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "social_links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "pinned_project_id" "uuid",
    CONSTRAINT "profiles_bio_check" CHECK (("char_length"("bio") <= 200)),
    CONSTRAINT "profiles_social_links_is_array" CHECK (("jsonb_typeof"("social_links") = 'array'::"text"))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_insights" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "phase" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "project_insights_content_check" CHECK (("char_length"("content") <= 500)),
    CONSTRAINT "project_insights_phase_check" CHECK ((("phase" IS NULL) OR ("phase" = ANY (ARRAY['idea'::"text", 'research'::"text", 'validation'::"text", 'decision'::"text"])))),
    CONSTRAINT "project_insights_sort_order_check" CHECK (("sort_order" >= 0)),
    CONSTRAINT "project_insights_type_check" CHECK (("type" = ANY (ARRAY['strength'::"text", 'opportunity'::"text", 'threat'::"text", 'decision'::"text"])))
);


ALTER TABLE "public"."project_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_note_folders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_note_folders_name_check" CHECK (("char_length"("name") <= 100))
);


ALTER TABLE "public"."project_note_folders" OWNER TO "postgres";


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
    CONSTRAINT "project_notes_sort_order_check" CHECK (("sort_order" >= 0)),
    CONSTRAINT "project_notes_title_check" CHECK (("char_length"("title") <= 200))
);


ALTER TABLE "public"."project_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "summary" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_responses" integer DEFAULT 30 NOT NULL,
    "description" "jsonb",
    "image_url" "text",
    "completed_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "pre_trash_status" "text",
    "pre_archive_status" "text",
    CONSTRAINT "projects_name_check" CHECK (("char_length"("name") <= 100)),
    CONSTRAINT "projects_pre_archive_status_check" CHECK ((("pre_archive_status" IS NULL) OR ("pre_archive_status" = ANY (ARRAY['active'::"text", 'completed'::"text"])))),
    CONSTRAINT "projects_pre_trash_status_check" CHECK ((("pre_trash_status" IS NULL) OR ("pre_trash_status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'archived'::"text"])))),
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'archived'::"text", 'trashed'::"text"]))),
    CONSTRAINT "projects_summary_check" CHECK ((("summary" IS NULL) OR ("char_length"("summary") <= 280))),
    CONSTRAINT "projects_target_responses_check" CHECK ((("target_responses" >= 1) AND ("target_responses" <= 10000)))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."summary" IS 'Short one-liner (max 280 chars). Shown on cards and headers.';



COMMENT ON COLUMN "public"."projects"."description" IS 'Rich content as Tiptap JSON document. Shown on project detail.';



COMMENT ON COLUMN "public"."projects"."image_url" IS 'URL to project thumbnail image in Supabase Storage.';



COMMENT ON COLUMN "public"."projects"."completed_at" IS 'When the project was marked as completed.';



COMMENT ON COLUMN "public"."projects"."deleted_at" IS 'When the project was soft-deleted (trashed). Auto-purged after 30 days.';



COMMENT ON COLUMN "public"."projects"."pre_trash_status" IS 'The status before trashing, used to restore to the correct state.';



COMMENT ON COLUMN "public"."projects"."pre_archive_status" IS 'The status before archiving, used to restore to the correct state.';



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
    "device_type" "text",
    "submitted_after_close" boolean DEFAULT false NOT NULL,
    "fingerprint" "text",
    CONSTRAINT "chk_completed_has_timestamp" CHECK ((("status" <> 'completed'::"text") OR ("completed_at" IS NOT NULL))),
    CONSTRAINT "survey_responses_device_type_check" CHECK ((("device_type" IS NULL) OR ("device_type" = ANY (ARRAY['desktop'::"text", 'mobile'::"text", 'tablet'::"text"])))),
    CONSTRAINT "survey_responses_feedback_check" CHECK ((("feedback" IS NULL) OR ("char_length"("feedback") <= 2000))),
    CONSTRAINT "survey_responses_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'abandoned'::"text"])))
);

ALTER TABLE ONLY "public"."survey_responses" REPLICA IDENTITY FULL;


ALTER TABLE "public"."survey_responses" OWNER TO "postgres";


COMMENT ON COLUMN "public"."survey_responses"."submitted_after_close" IS 'True when the response was submitted after the survey ended. These responses are preserved but excluded from statistics.';



COMMENT ON COLUMN "public"."survey_responses"."fingerprint" IS 'Hash of IP + user-agent, used to detect duplicate submissions from the same browser.';



CREATE TABLE IF NOT EXISTS "public"."surveys" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "visibility" "text" DEFAULT 'private'::"text" NOT NULL,
    "status" "public"."survey_status" DEFAULT 'draft'::"public"."survey_status" NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "max_respondents" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text",
    "completed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "previous_status" "public"."survey_status",
    "view_count" integer DEFAULT 0 NOT NULL,
    "project_id" "uuid" NOT NULL,
    "research_phase" "text",
    "deleted_at" timestamp with time zone,
    "pre_trash_status" "text",
    "generate_insights" boolean,
    CONSTRAINT "surveys_chk_completed_has_timestamp" CHECK ((("status" <> 'completed'::"public"."survey_status") OR ("completed_at" IS NOT NULL))),
    CONSTRAINT "surveys_dates_check" CHECK ((("ends_at" IS NULL) OR ("starts_at" IS NULL) OR ("ends_at" > "starts_at"))),
    CONSTRAINT "surveys_description_check" CHECK (("char_length"("description") <= 2000)),
    CONSTRAINT "surveys_max_respondents_check" CHECK ((("max_respondents" IS NULL) OR ("max_respondents" >= 1))),
    CONSTRAINT "surveys_pre_trash_status_check" CHECK ((("pre_trash_status" IS NULL) OR ("pre_trash_status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text", 'archived'::"text"])))),
    CONSTRAINT "surveys_research_phase_check" CHECK ((("research_phase" IS NULL) OR ("research_phase" = ANY (ARRAY['idea'::"text", 'research'::"text", 'validation'::"text", 'decision'::"text"])))),
    CONSTRAINT "surveys_slug_format_check" CHECK ((("slug" IS NULL) OR ("slug" ~ '^[A-Za-z0-9_-]{8,21}$'::"text"))),
    CONSTRAINT "surveys_title_check" CHECK (("char_length"("title") <= 100)),
    CONSTRAINT "surveys_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'public'::"text"])))
);

ALTER TABLE ONLY "public"."surveys" REPLICA IDENTITY FULL;


ALTER TABLE "public"."surveys" OWNER TO "postgres";


COMMENT ON COLUMN "public"."surveys"."deleted_at" IS 'When the survey was soft-deleted (trashed). Auto-purged after 30 days.';



COMMENT ON COLUMN "public"."surveys"."pre_trash_status" IS 'The status before trashing, used to restore to the correct state.';



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'insight_suggestion_actions_pkey') THEN
    ALTER TABLE ONLY "public"."insight_suggestion_actions"
        ADD CONSTRAINT "insight_suggestion_actions_pkey" PRIMARY KEY ("id");
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pkey') THEN
    ALTER TABLE ONLY "public"."profiles"
        ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_insights_pkey') THEN
    ALTER TABLE ONLY "public"."project_insights"
        ADD CONSTRAINT "project_insights_pkey" PRIMARY KEY ("id");
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_note_folders_pkey') THEN
    ALTER TABLE ONLY "public"."project_note_folders"
        ADD CONSTRAINT "project_note_folders_pkey" PRIMARY KEY ("id");
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_notes_pkey') THEN
    ALTER TABLE ONLY "public"."project_notes"
        ADD CONSTRAINT "project_notes_pkey" PRIMARY KEY ("id");
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_pkey') THEN
    ALTER TABLE ONLY "public"."projects"
        ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_answers_pkey') THEN
    ALTER TABLE ONLY "public"."survey_answers"
        ADD CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id");
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_answers_response_question_unique') THEN
    ALTER TABLE ONLY "public"."survey_answers"
        ADD CONSTRAINT "survey_answers_response_question_unique" UNIQUE ("response_id", "question_id");
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_questions_pkey') THEN
    ALTER TABLE ONLY "public"."survey_questions"
        ADD CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id");
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_responses_pkey') THEN
    ALTER TABLE ONLY "public"."survey_responses"
        ADD CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id");
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surveys_pkey') THEN
    ALTER TABLE ONLY "public"."surveys"
        ADD CONSTRAINT "surveys_pkey" PRIMARY KEY ("id");
  END IF;
END $$;



CREATE UNIQUE INDEX IF NOT EXISTS "insight_suggestion_actions_project_signature_idx" ON "public"."insight_suggestion_actions" USING "btree" ("project_id", "signature");



CREATE INDEX IF NOT EXISTS "project_insights_project_id_idx" ON "public"."project_insights" USING "btree" ("project_id");



CREATE INDEX IF NOT EXISTS "project_insights_project_type_sort_idx" ON "public"."project_insights" USING "btree" ("project_id", "type", "sort_order");



CREATE INDEX IF NOT EXISTS "project_note_folders_project_id_idx" ON "public"."project_note_folders" USING "btree" ("project_id");



CREATE INDEX IF NOT EXISTS "project_note_folders_user_id_idx" ON "public"."project_note_folders" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "project_notes_deleted_at_idx" ON "public"."project_notes" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "project_notes_folder_id_idx" ON "public"."project_notes" USING "btree" ("folder_id");



CREATE INDEX IF NOT EXISTS "project_notes_project_id_idx" ON "public"."project_notes" USING "btree" ("project_id");



CREATE INDEX IF NOT EXISTS "project_notes_user_id_idx" ON "public"."project_notes" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "projects_deleted_at_idx" ON "public"."projects" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "projects_user_id_idx" ON "public"."projects" USING "btree" ("user_id");



CREATE UNIQUE INDEX IF NOT EXISTS "projects_user_id_name_unique" ON "public"."projects" USING "btree" ("user_id", "lower"("name"));



CREATE INDEX IF NOT EXISTS "survey_answers_question_id_idx" ON "public"."survey_answers" USING "btree" ("question_id");



CREATE INDEX IF NOT EXISTS "survey_answers_response_id_idx" ON "public"."survey_answers" USING "btree" ("response_id");



CREATE UNIQUE INDEX IF NOT EXISTS "survey_questions_survey_id_sort_order_idx" ON "public"."survey_questions" USING "btree" ("survey_id", "sort_order");



CREATE INDEX IF NOT EXISTS "survey_responses_fingerprint_dedup_idx" ON "public"."survey_responses" USING "btree" ("survey_id", "fingerprint") WHERE (("fingerprint" IS NOT NULL) AND ("status" = 'completed'::"text"));



CREATE INDEX IF NOT EXISTS "survey_responses_survey_id_status_idx" ON "public"."survey_responses" USING "btree" ("survey_id", "status");



CREATE INDEX IF NOT EXISTS "surveys_deleted_at_idx" ON "public"."surveys" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "surveys_project_id_idx" ON "public"."surveys" USING "btree" ("project_id");



CREATE UNIQUE INDEX IF NOT EXISTS "surveys_slug_unique_idx" ON "public"."surveys" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "surveys_user_id_status_idx" ON "public"."surveys" USING "btree" ("user_id", "status");



CREATE OR REPLACE TRIGGER "profiles_prevent_clearing_required" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_clearing_required_fields"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "project_insights_set_updated_at" BEFORE UPDATE ON "public"."project_insights" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "project_note_folders_set_updated_at" BEFORE UPDATE ON "public"."project_note_folders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "project_notes_set_updated_at" BEFORE UPDATE ON "public"."project_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "projects_set_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "survey_answers_set_updated_at" BEFORE UPDATE ON "public"."survey_answers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "survey_questions_set_updated_at" BEFORE UPDATE ON "public"."survey_questions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "survey_responses_set_updated_at" BEFORE UPDATE ON "public"."survey_responses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "surveys_set_updated_at" BEFORE UPDATE ON "public"."surveys" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'insight_suggestion_actions_project_id_fkey') THEN
    ALTER TABLE ONLY "public"."insight_suggestion_actions"
        ADD CONSTRAINT "insight_suggestion_actions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey') THEN
    ALTER TABLE ONLY "public"."profiles"
        ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pinned_project_id_fkey') THEN
    ALTER TABLE ONLY "public"."profiles"
        ADD CONSTRAINT "profiles_pinned_project_id_fkey" FOREIGN KEY ("pinned_project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_insights_project_id_fkey') THEN
    ALTER TABLE ONLY "public"."project_insights"
        ADD CONSTRAINT "project_insights_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_note_folders_project_id_fkey') THEN
    ALTER TABLE ONLY "public"."project_note_folders"
        ADD CONSTRAINT "project_note_folders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_note_folders_user_id_fkey') THEN
    ALTER TABLE ONLY "public"."project_note_folders"
        ADD CONSTRAINT "project_note_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_notes_folder_id_fkey') THEN
    ALTER TABLE ONLY "public"."project_notes"
        ADD CONSTRAINT "project_notes_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."project_note_folders"("id") ON DELETE SET NULL;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_notes_project_id_fkey') THEN
    ALTER TABLE ONLY "public"."project_notes"
        ADD CONSTRAINT "project_notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_notes_user_id_fkey') THEN
    ALTER TABLE ONLY "public"."project_notes"
        ADD CONSTRAINT "project_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_user_id_fkey') THEN
    ALTER TABLE ONLY "public"."projects"
        ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_answers_question_id_fkey') THEN
    ALTER TABLE ONLY "public"."survey_answers"
        ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."survey_questions"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_answers_response_id_fkey') THEN
    ALTER TABLE ONLY "public"."survey_answers"
        ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."survey_responses"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_questions_survey_id_fkey') THEN
    ALTER TABLE ONLY "public"."survey_questions"
        ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_responses_survey_id_fkey') THEN
    ALTER TABLE ONLY "public"."survey_responses"
        ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surveys_project_id_fkey') THEN
    ALTER TABLE ONLY "public"."surveys"
        ADD CONSTRAINT "surveys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surveys_user_id_fkey') THEN
    ALTER TABLE ONLY "public"."surveys"
        ADD CONSTRAINT "surveys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
  END IF;
END $$;



DROP POLICY IF EXISTS "Anyone can create response for active survey" ON "public"."survey_responses";
CREATE POLICY "Anyone can create response for active survey" ON "public"."survey_responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_responses"."survey_id") AND ("surveys"."status" = 'active'::"public"."survey_status") AND ("surveys"."slug" IS NOT NULL)))));



DROP POLICY IF EXISTS "Anyone can insert answer for in-progress response" ON "public"."survey_answers";
CREATE POLICY "Anyone can insert answer for in-progress response" ON "public"."survey_answers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."survey_responses"
  WHERE (("survey_responses"."id" = "survey_answers"."response_id") AND ("survey_responses"."status" = 'in_progress'::"text")))));



DROP POLICY IF EXISTS "Anyone can update answer for in-progress response" ON "public"."survey_answers";
CREATE POLICY "Anyone can update answer for in-progress response" ON "public"."survey_answers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."survey_responses"
  WHERE (("survey_responses"."id" = "survey_answers"."response_id") AND ("survey_responses"."status" = 'in_progress'::"text")))));



DROP POLICY IF EXISTS "Anyone can update in-progress response" ON "public"."survey_responses";
CREATE POLICY "Anyone can update in-progress response" ON "public"."survey_responses" FOR UPDATE USING (("status" = 'in_progress'::"text")) WITH CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text"])));



DROP POLICY IF EXISTS "Owners can delete responses for own surveys" ON "public"."survey_responses";
CREATE POLICY "Owners can delete responses for own surveys" ON "public"."survey_responses" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_responses"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Owners can read answers for own surveys" ON "public"."survey_answers";
CREATE POLICY "Owners can read answers for own surveys" ON "public"."survey_answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."survey_responses" "sr"
     JOIN "public"."surveys" "s" ON (("s"."id" = "sr"."survey_id")))
  WHERE (("sr"."id" = "survey_answers"."response_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Owners can read responses for own surveys" ON "public"."survey_responses";
CREATE POLICY "Owners can read responses for own surveys" ON "public"."survey_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_responses"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Users can create own surveys" ON "public"."surveys";
CREATE POLICY "Users can create own surveys" ON "public"."surveys" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can create questions for own surveys" ON "public"."survey_questions";
CREATE POLICY "Users can create questions for own surveys" ON "public"."survey_questions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Users can delete own note folders" ON "public"."project_note_folders";
CREATE POLICY "Users can delete own note folders" ON "public"."project_note_folders" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can delete own notes" ON "public"."project_notes";
CREATE POLICY "Users can delete own notes" ON "public"."project_notes" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can delete own project insights" ON "public"."project_insights";
CREATE POLICY "Users can delete own project insights" ON "public"."project_insights" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_insights"."project_id") AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Users can delete own projects" ON "public"."projects";
CREATE POLICY "Users can delete own projects" ON "public"."projects" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can delete own suggestion actions" ON "public"."insight_suggestion_actions";
CREATE POLICY "Users can delete own suggestion actions" ON "public"."insight_suggestion_actions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "insight_suggestion_actions"."project_id") AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Users can delete own surveys" ON "public"."surveys";
CREATE POLICY "Users can delete own surveys" ON "public"."surveys" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can delete questions for own surveys" ON "public"."survey_questions";
CREATE POLICY "Users can delete questions for own surveys" ON "public"."survey_questions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Users can insert own note folders" ON "public"."project_note_folders";
CREATE POLICY "Users can insert own note folders" ON "public"."project_note_folders" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can insert own notes" ON "public"."project_notes";
CREATE POLICY "Users can insert own notes" ON "public"."project_notes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can insert own profile" ON "public"."profiles";
CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



DROP POLICY IF EXISTS "Users can insert own project insights" ON "public"."project_insights";
CREATE POLICY "Users can insert own project insights" ON "public"."project_insights" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_insights"."project_id") AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Users can insert own projects" ON "public"."projects";
CREATE POLICY "Users can insert own projects" ON "public"."projects" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can insert own suggestion actions" ON "public"."insight_suggestion_actions";
CREATE POLICY "Users can insert own suggestion actions" ON "public"."insight_suggestion_actions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "insight_suggestion_actions"."project_id") AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Users can read own profile" ON "public"."profiles";
CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



DROP POLICY IF EXISTS "Users can select own note folders" ON "public"."project_note_folders";
CREATE POLICY "Users can select own note folders" ON "public"."project_note_folders" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can select own notes" ON "public"."project_notes";
CREATE POLICY "Users can select own notes" ON "public"."project_notes" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can select own project insights" ON "public"."project_insights";
CREATE POLICY "Users can select own project insights" ON "public"."project_insights" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_insights"."project_id") AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Users can select own projects" ON "public"."projects";
CREATE POLICY "Users can select own projects" ON "public"."projects" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can select own suggestion actions" ON "public"."insight_suggestion_actions";
CREATE POLICY "Users can select own suggestion actions" ON "public"."insight_suggestion_actions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "insight_suggestion_actions"."project_id") AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Users can update own note folders" ON "public"."project_note_folders";
CREATE POLICY "Users can update own note folders" ON "public"."project_note_folders" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can update own notes" ON "public"."project_notes";
CREATE POLICY "Users can update own notes" ON "public"."project_notes" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";
CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



DROP POLICY IF EXISTS "Users can update own project insights" ON "public"."project_insights";
CREATE POLICY "Users can update own project insights" ON "public"."project_insights" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_insights"."project_id") AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_insights"."project_id") AND ("projects"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



DROP POLICY IF EXISTS "Users can update own projects" ON "public"."projects";
CREATE POLICY "Users can update own projects" ON "public"."projects" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can update own surveys" ON "public"."surveys";
CREATE POLICY "Users can update own surveys" ON "public"."surveys" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



DROP POLICY IF EXISTS "Users can update questions for own surveys" ON "public"."survey_questions";
CREATE POLICY "Users can update questions for own surveys" ON "public"."survey_questions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND ("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."insight_suggestion_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_note_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "select_survey_questions" ON "public"."survey_questions";
CREATE POLICY "select_survey_questions" ON "public"."survey_questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."surveys"
  WHERE (("surveys"."id" = "survey_questions"."survey_id") AND (("surveys"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("surveys"."slug" IS NOT NULL) AND (("surveys"."status" = 'active'::"public"."survey_status") OR (("surveys"."status" = 'completed'::"public"."survey_status") AND ("surveys"."completed_at" IS NOT NULL) AND ("surveys"."completed_at" > ("now"() - '30 days'::interval))) OR (("surveys"."status" = 'cancelled'::"public"."survey_status") AND ("surveys"."cancelled_at" IS NOT NULL) AND ("surveys"."cancelled_at" > ("now"() - '30 days'::interval))))))))));



DROP POLICY IF EXISTS "select_surveys" ON "public"."surveys";
CREATE POLICY "select_surveys" ON "public"."surveys" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("slug" IS NOT NULL) AND (("status" = 'active'::"public"."survey_status") OR (("status" = 'completed'::"public"."survey_status") AND ("completed_at" IS NOT NULL) AND ("completed_at" > ("now"() - '30 days'::interval))) OR (("status" = 'cancelled'::"public"."survey_status") AND ("cancelled_at" IS NOT NULL) AND ("cancelled_at" > ("now"() - '30 days'::interval)))))));



ALTER TABLE "public"."survey_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."surveys" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'survey_responses'
  ) THEN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."survey_responses";
  END IF;
END $$;



DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'surveys'
  ) THEN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."surveys";
  END IF;
END $$;









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































REVOKE ALL ON FUNCTION "public"."cancel_email_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_email_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_email_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_email_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."change_project_status_with_cascade"("p_project_id" "uuid", "p_user_id" "uuid", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."change_project_status_with_cascade"("p_project_id" "uuid", "p_user_id" "uuid", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."change_project_status_with_cascade"("p_project_id" "uuid", "p_user_id" "uuid", "p_action" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_abandoned_responses"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_abandoned_responses"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_abandoned_responses"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_abandoned_responses"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."complete_expired_surveys"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_expired_surveys"() TO "anon";
GRANT ALL ON FUNCTION "public"."complete_expired_surveys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_expired_surveys"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."decrypt_pii"("encrypted" "bytea") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."decrypt_pii"("encrypted" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_pii"("encrypted" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_pii"("encrypted" "bytea") TO "service_role";



REVOKE ALL ON FUNCTION "public"."encrypt_pii"("plain_text" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."encrypt_pii"("plain_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_pii"("plain_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_pii"("plain_text" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."find_user_by_email_excluding"("lookup_email" "text", "exclude_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."find_user_by_email_excluding"("lookup_email" "text", "exclude_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_overview"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("p_user_id" "uuid", "p_days" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_email_change_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_email_change_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_email_change_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_email_change_status"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_export_responses"("p_survey_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_export_responses"("p_survey_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_export_responses"("p_survey_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_export_responses"("p_survey_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_project_detail_stats"("p_project_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_project_detail_stats"("p_project_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_detail_stats"("p_project_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_detail_stats"("p_project_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_surveys_with_counts"("p_user_id" "uuid", "p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_surveys_with_counts"("p_user_id" "uuid", "p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_surveys_with_counts"("p_user_id" "uuid", "p_project_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_projects_list_extras"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_research_journey"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_research_journey"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_research_journey"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_research_journey"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_response_detail"("p_response_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_response_detail"("p_response_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_response_detail"("p_response_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_survey_completion_timeline"("p_survey_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_survey_completion_timeline"("p_survey_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_survey_completion_timeline"("p_survey_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_survey_completion_timeline"("p_survey_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_survey_response_count"("p_survey_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_survey_responses_list"("p_survey_id" "uuid", "p_user_id" "uuid", "p_page" integer, "p_per_page" integer, "p_status" "text", "p_device" "text", "p_has_contact" boolean, "p_search" "text", "p_sort_by" "text", "p_sort_dir" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_survey_responses_list"("p_survey_id" "uuid", "p_user_id" "uuid", "p_page" integer, "p_per_page" integer, "p_status" "text", "p_device" "text", "p_has_contact" boolean, "p_search" "text", "p_sort_by" "text", "p_sort_dir" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_survey_responses_list"("p_survey_id" "uuid", "p_user_id" "uuid", "p_page" integer, "p_per_page" integer, "p_status" "text", "p_device" "text", "p_has_contact" boolean, "p_search" "text", "p_sort_by" "text", "p_sort_dir" "text", "p_date_from" timestamp with time zone, "p_date_to" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_survey_stats_data"("p_survey_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_survey_stats_data"("p_survey_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_survey_stats_data"("p_survey_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_survey_stats_data"("p_survey_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("lookup_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("lookup_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("lookup_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_surveys_with_counts"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_surveys_with_counts"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_surveys_with_counts"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_surveys_with_counts"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_password"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."has_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_password"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."merge_user_data"("from_user_id" "uuid", "to_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."merge_user_data"("from_user_id" "uuid", "to_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_clearing_required_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_clearing_required_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_clearing_required_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."purge_trashed_projects"() TO "anon";
GRANT ALL ON FUNCTION "public"."purge_trashed_projects"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."purge_trashed_projects"() TO "service_role";



GRANT ALL ON FUNCTION "public"."purge_trashed_surveys"() TO "anon";
GRANT ALL ON FUNCTION "public"."purge_trashed_surveys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."purge_trashed_surveys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_survey_view"("p_survey_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."record_survey_view"("p_survey_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_survey_view"("p_survey_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_survey_questions"("p_survey_id" "uuid", "p_user_id" "uuid", "p_questions" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_survey_questions"("p_survey_id" "uuid", "p_user_id" "uuid", "p_questions" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_survey_questions"("p_survey_id" "uuid", "p_user_id" "uuid", "p_questions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_survey_questions"("p_survey_id" "uuid", "p_user_id" "uuid", "p_questions" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text", "p_fingerprint" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text", "p_fingerprint" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_survey_response"("p_survey_id" "uuid", "p_device_type" "text", "p_fingerprint" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text", "p_contact_email" "text", "p_feedback" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text", "p_contact_email" "text", "p_feedback" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_survey_response"("p_response_id" "uuid", "p_contact_name" "text", "p_contact_email" "text", "p_feedback" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_and_save_answer"("p_response_id" "uuid", "p_question_id" "uuid", "p_value" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_and_save_answer"("p_response_id" "uuid", "p_question_id" "uuid", "p_value" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_and_save_answer"("p_response_id" "uuid", "p_question_id" "uuid", "p_value" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."verify_password"("current_plain_password" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."verify_password"("current_plain_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_password"("current_plain_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_password"("current_plain_password" "text") TO "service_role";
























GRANT ALL ON TABLE "public"."insight_suggestion_actions" TO "anon";
GRANT ALL ON TABLE "public"."insight_suggestion_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."insight_suggestion_actions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_insights" TO "anon";
GRANT ALL ON TABLE "public"."project_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."project_insights" TO "service_role";



GRANT ALL ON TABLE "public"."project_note_folders" TO "anon";
GRANT ALL ON TABLE "public"."project_note_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."project_note_folders" TO "service_role";



GRANT ALL ON TABLE "public"."project_notes" TO "anon";
GRANT ALL ON TABLE "public"."project_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."project_notes" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



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

DROP POLICY IF EXISTS "Public avatar read" ON "storage"."objects";
CREATE POLICY "Public avatar read" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));



DROP POLICY IF EXISTS "Public project image read" ON "storage"."objects";
CREATE POLICY "Public project image read" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'project-images'::"text"));



DROP POLICY IF EXISTS "Users can delete own avatar" ON "storage"."objects";
CREATE POLICY "Users can delete own avatar" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'avatars'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



DROP POLICY IF EXISTS "Users can delete project image" ON "storage"."objects";
CREATE POLICY "Users can delete project image" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'project-images'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



DROP POLICY IF EXISTS "Users can update own avatar" ON "storage"."objects";
CREATE POLICY "Users can update own avatar" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'avatars'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



DROP POLICY IF EXISTS "Users can update project image" ON "storage"."objects";
CREATE POLICY "Users can update project image" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'project-images'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



DROP POLICY IF EXISTS "Users can upload own avatar" ON "storage"."objects";
CREATE POLICY "Users can upload own avatar" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'avatars'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



DROP POLICY IF EXISTS "Users can upload project image" ON "storage"."objects";
CREATE POLICY "Users can upload project image" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'project-images'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



