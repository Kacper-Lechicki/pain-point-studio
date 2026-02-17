-- ============================================================================
-- Security Hardening Migration
-- ============================================================================
-- 1. Revoke anon access from sensitive RPCs (defense-in-depth)
-- 2. Add auth.uid() ownership checks to data-reading RPCs
-- 3. Add abandoned response cleanup + cron scheduling
-- 4. Schedule complete_expired_surveys cron
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Add auth.uid() ownership checks to data-reading RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_profile_statistics(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
AS $$
DECLARE
    v_total_surveys int;
    v_total_responses bigint;
    v_completed_responses bigint;
    v_avg_submission_rate int;
    v_member_since timestamptz;
BEGIN
    -- Ownership check: caller must be the requested user
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    SELECT count(*)
    INTO v_total_surveys
    FROM public.surveys
    WHERE user_id = p_user_id AND status IN ('active', 'completed');

    SELECT
        count(*),
        count(*) FILTER (WHERE r.status = 'completed')
    INTO v_total_responses, v_completed_responses
    FROM public.survey_responses r
    JOIN public.surveys s ON s.id = r.survey_id
    WHERE s.user_id = p_user_id
      AND s.status IN ('active', 'completed');

    IF v_total_responses > 0 THEN
        v_avg_submission_rate := round((v_completed_responses::numeric / v_total_responses) * 100);
    ELSE
        v_avg_submission_rate := 0;
    END IF;

    SELECT created_at INTO v_member_since
    FROM auth.users
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'totalSurveys', v_total_surveys,
        'totalResponses', v_total_responses,
        'completedResponses', v_completed_responses,
        'avgSubmissionRate', v_avg_submission_rate,
        'memberSince', v_member_since
    );
END;
$$;


CREATE OR REPLACE FUNCTION public.get_user_surveys_with_counts(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
AS $$
BEGIN
    -- Ownership check: caller must be the requested user
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

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
                'completedAt', s.completed_at,
                'createdAt', s.created_at,
                'updatedAt', s.updated_at,
                'avgCompletionSeconds', ct.avg_secs,
                'avgQuestionCompletion', aqc.avg_pct
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

        -- Most recent completed response timestamp
        LEFT JOIN (
            SELECT survey_id, max(completed_at) AS last_at
            FROM public.survey_responses
            WHERE status = 'completed'
              AND completed_at IS NOT NULL
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

        -- Average completion time (seconds) for completed responses
        LEFT JOIN (
            SELECT survey_id,
                   round(avg(extract(epoch FROM (completed_at - started_at))))::int AS avg_secs
            FROM public.survey_responses
            WHERE status = 'completed'
              AND completed_at IS NOT NULL
              AND started_at IS NOT NULL
            GROUP BY survey_id
        ) ct ON ct.survey_id = s.id

        -- Count total answers from completed responses for this survey
        LEFT JOIN LATERAL (
            SELECT count(*) AS total_answers
            FROM public.survey_answers a
            JOIN public.survey_responses r ON r.id = a.response_id
            WHERE r.survey_id = s.id
              AND r.status = 'completed'
        ) ac ON true

        -- Average question completion % across completed responses
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


CREATE OR REPLACE FUNCTION public.get_survey_stats_data(p_survey_id uuid, p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
AS $$
DECLARE
    v_result jsonb;
    v_timeline_start date;
BEGIN
    -- Ownership check: caller must be the requested user
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    -- Determine timeline start: survey publish date or 30 days ago, whichever is later
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
            SELECT min(created_at) FROM public.survey_responses WHERE survey_id = p_survey_id
        ),
        'lastResponseAt', (
            SELECT max(created_at) FROM public.survey_responses WHERE survey_id = p_survey_id
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


-- ---------------------------------------------------------------------------
-- 3. Abandoned response cleanup
-- ---------------------------------------------------------------------------

-- Add 'abandoned' to the status check constraint
ALTER TABLE public.survey_responses
    DROP CONSTRAINT survey_responses_status_check;

ALTER TABLE public.survey_responses
    ADD CONSTRAINT survey_responses_status_check
    CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text]));

-- Function to mark stale in_progress responses as abandoned
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_responses() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
AS $$
BEGIN
    UPDATE public.survey_responses
    SET status = 'abandoned',
        updated_at = now()
    WHERE status = 'in_progress'
      AND started_at < now() - interval '24 hours';
END;
$$;

ALTER FUNCTION public.cleanup_abandoned_responses() OWNER TO postgres;

-- Update start_survey_response to ignore stale in_progress when counting toward max
CREATE OR REPLACE FUNCTION public.start_survey_response(p_survey_id uuid, p_device_type text DEFAULT NULL) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
AS $$
DECLARE
  v_max integer;
  v_current integer;
  v_status text;
  v_response_id uuid;
BEGIN
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
    -- Count completed + recent in_progress (ignore stale/abandoned)
    SELECT count(*)
      INTO v_current
      FROM survey_responses
     WHERE survey_id = p_survey_id
       AND (
         status = 'completed'
         OR (status = 'in_progress' AND started_at > now() - interval '24 hours')
       );

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'MAX_RESPONDENTS_REACHED';
    END IF;
  END IF;

  INSERT INTO survey_responses (survey_id, device_type)
  VALUES (p_survey_id, p_device_type)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;


-- ---------------------------------------------------------------------------
-- 4. Schedule cron jobs
-- ---------------------------------------------------------------------------

-- Complete expired surveys every 5 minutes
SELECT cron.schedule(
    'complete-expired-surveys',
    '*/5 * * * *',
    $$SELECT public.complete_expired_surveys()$$
);

-- Cleanup abandoned responses every hour
SELECT cron.schedule(
    'cleanup-abandoned-responses',
    '0 * * * *',
    $$SELECT public.cleanup_abandoned_responses()$$
);


-- ---------------------------------------------------------------------------
-- 5. REVOKE anon grants from sensitive functions
-- ---------------------------------------------------------------------------
-- IMPORTANT: Must come AFTER all CREATE OR REPLACE statements, because
-- default privileges (ALTER DEFAULT PRIVILEGES ... GRANT EXECUTE TO anon)
-- re-grant access when functions are recreated.

-- Revoke from both PUBLIC (implicit grant) and anon (explicit grant)
REVOKE ALL ON FUNCTION public.verify_password(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.decrypt_pii(bytea) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.encrypt_pii(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_email_change() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_password() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_email_change_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_expired_surveys() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cleanup_abandoned_responses() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_profile_statistics(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_surveys_with_counts(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_survey_stats_data(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_export_responses(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_survey_questions(uuid, uuid, jsonb) FROM PUBLIC, anon;

-- Re-grant to authenticated and service_role only
GRANT EXECUTE ON FUNCTION public.verify_password(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_pii(bytea) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.encrypt_pii(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_email_change() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_password() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_email_change_status() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_expired_surveys() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_abandoned_responses() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_profile_statistics(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_surveys_with_counts(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_survey_stats_data(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_export_responses(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_survey_questions(uuid, uuid, jsonb) TO authenticated, service_role;
