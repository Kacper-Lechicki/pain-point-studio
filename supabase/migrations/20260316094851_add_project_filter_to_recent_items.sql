-- ============================================================================
-- Migration: add_project_filter_to_recent_items
-- Adds optional project_id filter and configurable limit to get_recent_items.
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."get_recent_items"(
    "p_item_type" "text",
    "p_limit" integer DEFAULT 5,
    "p_project_id" "uuid" DEFAULT NULL
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
            AND (p_project_id IS NULL OR s.project_id = p_project_id)
        ORDER BY ri.visited_at DESC
        LIMIT p_limit
    ) r;
$$;
