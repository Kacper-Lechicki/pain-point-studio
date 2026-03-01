-- Migrate Notes from plain TEXT to Tiptap JSONB
-- ================================================
-- The Notes tab is being upgraded from a textarea + markdown-preview
-- to the shared Tiptap RichEditor. This migration:
--   1. Adds the new notes_json JSONB column
--   2. Converts existing text notes to Tiptap JSON format
--   3. Drops the old notes TEXT column

-- 1. Add new column
ALTER TABLE projects ADD COLUMN notes_json JSONB DEFAULT NULL;

-- 2. Convert existing text notes to Tiptap JSON
-- Mirrors the textToTiptapJson() function in the app:
--   - Double newlines split into separate paragraphs
--   - Single newlines become hardBreak nodes within a paragraph
--   - Empty text results in NULL (no empty doc stored)
UPDATE projects
SET notes_json = (
  SELECT jsonb_build_object(
    'type', 'doc',
    'content', jsonb_agg(paragraph_json ORDER BY paragraph_index)
  )
  FROM (
    SELECT
      row_number() OVER () AS paragraph_index,
      CASE
        WHEN trim(paragraph_text) = '' THEN
          jsonb_build_object('type', 'paragraph')
        ELSE
          jsonb_build_object(
            'type', 'paragraph',
            'content', (
              SELECT jsonb_agg(node ORDER BY line_index)
              FROM (
                SELECT
                  row_number() OVER () AS line_index,
                  node
                FROM (
                  -- For each line in the paragraph, emit a text node
                  -- followed by a hardBreak (except after the last line)
                  SELECT
                    (row_number() OVER ()) * 2 - 1 AS line_index,
                    jsonb_build_object('type', 'text', 'text', line) AS node
                  FROM unnest(string_to_array(trim(paragraph_text), E'\n')) WITH ORDINALITY AS t(line, ord)
                  WHERE line <> ''
                  UNION ALL
                  SELECT
                    t.ord * 2 AS line_index,
                    jsonb_build_object('type', 'hardBreak') AS node
                  FROM unnest(string_to_array(trim(paragraph_text), E'\n')) WITH ORDINALITY AS t(line, ord)
                  WHERE line <> ''
                    AND t.ord < array_length(string_to_array(trim(paragraph_text), E'\n'), 1)
                ) sub
              ) ordered_nodes
            )
          )
      END AS paragraph_json
    FROM unnest(
      string_to_array(notes, E'\n\n')
    ) WITH ORDINALITY AS p(paragraph_text, paragraph_index)
  ) paragraphs
)
WHERE notes IS NOT NULL AND trim(notes) <> '';

-- 3. Drop old column
ALTER TABLE projects DROP COLUMN notes;
