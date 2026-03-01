-- Add sort_order to project_insights for kanban drag-and-drop reordering.
-- Each insight gets a position within its (project_id, type) group.

ALTER TABLE "public"."project_insights"
  ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;

ALTER TABLE "public"."project_insights"
  ADD CONSTRAINT "project_insights_sort_order_check"
    CHECK ("sort_order" >= 0);

-- Backfill existing rows: order by created_at within each (project_id, type) group.
UPDATE "public"."project_insights" AS pi
SET "sort_order" = sub.rn
FROM (
  SELECT "id",
         ROW_NUMBER() OVER (
           PARTITION BY "project_id", "type"
           ORDER BY "created_at" ASC
         ) - 1 AS rn
  FROM "public"."project_insights"
) AS sub
WHERE pi."id" = sub."id";

-- Composite index for efficient per-column ordering queries.
CREATE INDEX IF NOT EXISTS "project_insights_project_type_sort_idx"
  ON "public"."project_insights" USING "btree" ("project_id", "type", "sort_order");
