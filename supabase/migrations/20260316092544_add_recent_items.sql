-- ============================================================================
-- Migration: add_recent_items
-- Tracks recently visited projects and surveys per user.
-- ============================================================================

-- ── Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."user_recent_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "visited_at" timestamp with time zone DEFAULT "now"() NOT NULL,

    CONSTRAINT "user_recent_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_recent_items_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "user_recent_items_user_item_unique"
        UNIQUE ("user_id", "item_id"),
    CONSTRAINT "user_recent_items_item_type_check"
        CHECK ("item_type" IN ('project', 'survey'))
);

ALTER TABLE "public"."user_recent_items" OWNER TO "postgres";

COMMENT ON TABLE "public"."user_recent_items"
    IS 'Tracks recently visited projects and surveys per user for sidebar navigation.';

CREATE INDEX IF NOT EXISTS "user_recent_items_user_visited_idx"
    ON "public"."user_recent_items" ("user_id", "visited_at" DESC);

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE "public"."user_recent_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recent items"
    ON "public"."user_recent_items" FOR ALL
    USING ("auth"."uid"() = "user_id")
    WITH CHECK ("auth"."uid"() = "user_id");

-- ── RPC: upsert_recent_item ────────────────────────────────────────────────
-- Fire-and-forget upsert. Trims oldest entries beyond 5 per item_type.

CREATE OR REPLACE FUNCTION "public"."upsert_recent_item"(
    "p_item_id" "uuid",
    "p_item_type" "text"
) RETURNS "void"
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    INSERT INTO public.user_recent_items (user_id, item_id, item_type, visited_at)
    VALUES (v_user_id, p_item_id, p_item_type, now())
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET visited_at = now(), item_type = EXCLUDED.item_type;

    DELETE FROM public.user_recent_items
    WHERE id IN (
        SELECT id FROM public.user_recent_items
        WHERE user_id = v_user_id AND item_type = p_item_type
        ORDER BY visited_at DESC
        OFFSET 5
    );
END;
$$;

-- ── RPC: get_recent_items ──────────────────────────────────────────────────
-- Returns recent items with fresh labels by joining to source tables.
-- Filters out trashed/cancelled items automatically.

CREATE OR REPLACE FUNCTION "public"."get_recent_items"(
    "p_item_type" "text",
    "p_limit" integer DEFAULT 5
) RETURNS "jsonb"
    LANGUAGE "sql"
    STABLE
    SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT COALESCE(
        jsonb_agg(to_jsonb(r) ORDER BY r.visited_at DESC),
        '[]'::jsonb
    )
    FROM (
        SELECT
            ri.item_id AS id,
            CASE ri.item_type
                WHEN 'project' THEN p.name
                WHEN 'survey' THEN s.title
            END AS label,
            CASE ri.item_type
                WHEN 'project' THEN p.image_url
                ELSE NULL
            END AS "imageUrl",
            ri.item_type AS type,
            ri.visited_at
        FROM public.user_recent_items ri
        LEFT JOIN public.projects p
            ON ri.item_type = 'project' AND p.id = ri.item_id
        LEFT JOIN public.surveys s
            ON ri.item_type = 'survey' AND s.id = ri.item_id
        WHERE ri.user_id = auth.uid()
            AND ri.item_type = p_item_type
            AND (
                (ri.item_type = 'project' AND p.id IS NOT NULL AND p.status != 'trashed')
                OR (ri.item_type = 'survey' AND s.id IS NOT NULL AND s.status NOT IN ('trashed', 'cancelled'))
            )
        ORDER BY ri.visited_at DESC
        LIMIT p_limit
    ) r;
$$;
