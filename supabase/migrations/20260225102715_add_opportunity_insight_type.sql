-- Add 'opportunity' to the allowed insight types for project_insights.
-- This is a metadata-only change (no table rewrite).

ALTER TABLE "public"."project_insights"
  DROP CONSTRAINT IF EXISTS "project_insights_type_check";

ALTER TABLE "public"."project_insights"
  ADD CONSTRAINT "project_insights_type_check"
  CHECK (("type" = ANY (ARRAY[
    'strength'::"text",
    'opportunity'::"text",
    'threat'::"text",
    'decision'::"text"
  ])));
