-- =============================================================================
-- Migration: add_project_notes
-- Description: Add a notes column to the projects table for markdown notes.
-- =============================================================================

ALTER TABLE "public"."projects"
    ADD COLUMN IF NOT EXISTS "notes" "text";
