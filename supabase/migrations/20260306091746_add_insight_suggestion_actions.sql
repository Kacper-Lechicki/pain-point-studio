-- Track user actions (accept / dismiss) on auto-generated insight suggestions.
-- Each row links a project to a stable finding signature so the same suggestion
-- is never shown again after the user acts on it.

CREATE TABLE IF NOT EXISTS "public"."insight_suggestion_actions" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "project_id" uuid NOT NULL,
    "signature" text NOT NULL,
    "action" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "insight_suggestion_actions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "insight_suggestion_actions_action_check"
      CHECK ("action" IN ('accepted', 'dismissed')),
    CONSTRAINT "insight_suggestion_actions_signature_length_check"
      CHECK (char_length("signature") <= 500)
);

ALTER TABLE "public"."insight_suggestion_actions" OWNER TO "postgres";

-- Each signature should only have one action per project
CREATE UNIQUE INDEX IF NOT EXISTS "insight_suggestion_actions_project_signature_idx"
  ON "public"."insight_suggestion_actions" ("project_id", "signature");

-- Foreign key to projects (cascade delete when project is removed)
ALTER TABLE ONLY "public"."insight_suggestion_actions"
    ADD CONSTRAINT "insight_suggestion_actions_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

-- ── Row Level Security ───────────────────────────────────────────────

ALTER TABLE "public"."insight_suggestion_actions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own suggestion actions"
  ON "public"."insight_suggestion_actions" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "public"."projects"
    WHERE projects.id = insight_suggestion_actions.project_id
      AND projects.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can insert own suggestion actions"
  ON "public"."insight_suggestion_actions" FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM "public"."projects"
    WHERE projects.id = insight_suggestion_actions.project_id
      AND projects.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete own suggestion actions"
  ON "public"."insight_suggestion_actions" FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM "public"."projects"
    WHERE projects.id = insight_suggestion_actions.project_id
      AND projects.user_id = (SELECT auth.uid())
  ));

-- ── Grants ────────────────────────────────────────────────────────────

GRANT ALL ON TABLE "public"."insight_suggestion_actions" TO "anon";
GRANT ALL ON TABLE "public"."insight_suggestion_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."insight_suggestion_actions" TO "service_role";
