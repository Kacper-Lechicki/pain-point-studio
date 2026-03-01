import type { JSONContent } from '@tiptap/react';

import { NOTE_TITLE_MAX_LENGTH } from '@/features/projects/config';

/**
 * Extract a title from the first block of Tiptap JSON content.
 * Walks the first paragraph/heading node and concatenates its text children.
 * Falls back to 'Untitled' for empty or non-text content.
 */
export function extractTitleFromTiptap(json: JSONContent | null | undefined): string {
  if (!json?.content?.length) {
    return 'Untitled';
  }

  const firstBlock = json.content[0];

  if (!firstBlock) {
    return 'Untitled';
  }

  const text = extractTextFromNode(firstBlock).trim();

  if (!text) {
    return 'Untitled';
  }

  return text.length > NOTE_TITLE_MAX_LENGTH ? text.slice(0, NOTE_TITLE_MAX_LENGTH) : text;
}

/** Recursively concatenate text from a Tiptap node and its children. */
function extractTextFromNode(node: JSONContent): string {
  if (node.type === 'text') {
    return node.text ?? '';
  }

  if (!node.content?.length) {
    return '';
  }

  return node.content.map(extractTextFromNode).join('');
}
