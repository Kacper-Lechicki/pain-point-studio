import type { JSONContent } from '@tiptap/react';

/**
 * Check if a Tiptap JSON document is empty.
 * An empty document is null, undefined, has no content,
 * or contains only a single empty paragraph (Tiptap's default empty state).
 */
export function isTiptapEmpty(json: JSONContent | null | undefined): boolean {
  if (!json) {
    return true;
  }

  if (!json.content || json.content.length === 0) {
    return true;
  }

  // Single empty paragraph is Tiptap's default empty state
  const first = json.content[0];

  if (
    json.content.length === 1 &&
    first &&
    first.type === 'paragraph' &&
    (!first.content || first.content.length === 0)
  ) {
    return true;
  }

  return false;
}
