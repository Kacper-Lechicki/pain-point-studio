-- Remove unused 'pending' status from RLS policies and fix retention
-- consistency in select_survey_questions.
--
-- Note: the 'pending' value remains in the survey_status enum because
-- PostgreSQL does not support dropping individual enum values.  No
-- application code path ever sets this status, so removing it from
-- the policies is sufficient.

-- ── surveys ─────────────────────────────────────────────────────────
-- Public access: active (any time), completed/cancelled (within 14d).
-- Owners always see their own surveys.

DROP POLICY IF EXISTS "select_surveys" ON "public"."surveys";
CREATE POLICY "select_surveys" ON "public"."surveys" FOR SELECT USING (
  (
    (SELECT auth.uid()) = user_id
  )
  OR
  (
    slug IS NOT NULL
    AND (
      status = 'active'::public.survey_status
      OR (
        status = 'completed'::public.survey_status
        AND completed_at IS NOT NULL
        AND completed_at > (now() - interval '14 days')
      )
      OR (
        status = 'cancelled'::public.survey_status
        AND cancelled_at IS NOT NULL
        AND cancelled_at > (now() - interval '14 days')
      )
    )
  )
);


-- ── survey_questions ────────────────────────────────────────────────
-- Previously allowed public access to questions of 'completed' surveys
-- without the 14-day retention check.  This update aligns the policy
-- with select_surveys so questions are hidden once the survey falls
-- outside the retention window.

DROP POLICY IF EXISTS "select_survey_questions" ON "public"."survey_questions";
CREATE POLICY "select_survey_questions" ON "public"."survey_questions" FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.surveys
    WHERE surveys.id = survey_questions.survey_id
      AND (
        surveys.user_id = (SELECT auth.uid())
        OR (
          surveys.slug IS NOT NULL
          AND (
            surveys.status = 'active'::public.survey_status
            OR (
              surveys.status = 'completed'::public.survey_status
              AND surveys.completed_at IS NOT NULL
              AND surveys.completed_at > (now() - interval '14 days')
            )
            OR (
              surveys.status = 'cancelled'::public.survey_status
              AND surveys.cancelled_at IS NOT NULL
              AND surveys.cancelled_at > (now() - interval '14 days')
            )
          )
        )
      )
  )
);
