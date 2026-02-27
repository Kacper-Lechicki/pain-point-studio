-- Add target_responses column to projects table.
-- Static DEFAULT 30 means no table rewrite — safe for production.
ALTER TABLE "public"."projects"
  ADD COLUMN "target_responses" integer NOT NULL DEFAULT 30;

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_target_responses_check"
  CHECK (target_responses >= 1 AND target_responses <= 10000);
