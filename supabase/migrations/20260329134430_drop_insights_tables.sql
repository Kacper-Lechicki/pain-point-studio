-- Drop insight_suggestion_actions first (no FK deps on it)
DROP TABLE IF EXISTS "public"."insight_suggestion_actions";

-- Drop project_insights
DROP TABLE IF EXISTS "public"."project_insights";

-- Drop the insight_source enum type added in 20260321110601
DROP TYPE IF EXISTS "public"."insight_source";
