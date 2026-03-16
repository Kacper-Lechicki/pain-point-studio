-- ============================================================================
-- Migration: optimize_recent_items_index
-- Replaces (user_id, visited_at) index with (user_id, item_type, visited_at)
-- to cover RLS policy + get_recent_items / upsert_recent_item query patterns.
-- ============================================================================

DROP INDEX IF EXISTS "public"."user_recent_items_user_visited_idx";

CREATE INDEX IF NOT EXISTS "user_recent_items_user_type_visited_idx"
    ON "public"."user_recent_items" ("user_id", "item_type", "visited_at" DESC);
