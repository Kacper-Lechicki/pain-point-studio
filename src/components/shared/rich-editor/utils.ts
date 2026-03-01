import type { JSONContent } from '@tiptap/react';

/**
 * Convert plain text (with newlines) to a minimal Tiptap JSON document.
 * Double newlines create new paragraphs, single newlines create hard breaks.
 */
export function textToTiptapJson(text: string): JSONContent {
  if (!text.trim()) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }

  const paragraphs = text.split(/\n{2,}/);

  const content: JSONContent[] = paragraphs.map((paragraph) => {
    const trimmed = paragraph.trim();

    if (!trimmed) {
      return { type: 'paragraph' } satisfies JSONContent;
    }

    const lines = trimmed.split('\n');
    const inlineContent: JSONContent[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line) {
        inlineContent.push({ type: 'text', text: line });
      }

      if (i < lines.length - 1) {
        inlineContent.push({ type: 'hardBreak' });
      }
    }

    if (inlineContent.length === 0) {
      return { type: 'paragraph' } satisfies JSONContent;
    }

    return { type: 'paragraph', content: inlineContent } satisfies JSONContent;
  });

  return { type: 'doc', content };
}

/**
 * Extract plain text from Tiptap JSON (for search, previews).
 * Walks the JSON tree recursively and joins text nodes.
 */
export function tiptapJsonToPlainText(json: JSONContent | null | undefined): string {
  if (!json) {
    return '';
  }

  if (json.type === 'text') {
    return json.text ?? '';
  }

  if (json.type === 'hardBreak') {
    return '\n';
  }

  if (!json.content || json.content.length === 0) {
    return '';
  }

  const BLOCK_TYPES = new Set([
    'paragraph',
    'heading',
    'blockquote',
    'codeBlock',
    'bulletList',
    'orderedList',
    'listItem',
    'horizontalRule',
    'image',
  ]);

  const parts: string[] = [];

  for (let i = 0; i < json.content.length; i++) {
    const child = json.content[i]!;
    const text = tiptapJsonToPlainText(child);

    if (text) {
      parts.push(text);
    }

    // Add newline between block-level nodes (not after the last one)
    if (i < json.content.length - 1 && BLOCK_TYPES.has(child.type ?? '')) {
      parts.push('\n');
    }
  }

  return parts.join('');
}

/**
 * Truncate Tiptap JSON to first N characters for preview.
 * Returns a new valid JSON document containing only nodes up to the limit.
 */
export function truncateTiptapJson(
  json: JSONContent,
  maxChars: number
): { json: JSONContent; truncated: boolean } {
  if (!json.content || json.content.length === 0) {
    return { json, truncated: false };
  }

  let charCount = 0;
  let truncated = false;
  const resultContent: JSONContent[] = [];

  for (const node of json.content) {
    const nodeText = tiptapJsonToPlainText(node);
    const nodeLength = nodeText.length;

    if (charCount + nodeLength <= maxChars) {
      resultContent.push(node);
      charCount += nodeLength;
    } else {
      // Truncate this node's text content
      const remaining = maxChars - charCount;

      if (remaining > 0) {
        const truncatedNode = truncateNode(node, remaining);

        if (truncatedNode) {
          resultContent.push(truncatedNode);
        }
      }

      truncated = true;
      break;
    }
  }

  return {
    json: { type: 'doc', content: resultContent },
    truncated,
  };
}

/** Recursively truncate a single node to fit within maxChars. */
function truncateNode(node: JSONContent, maxChars: number): JSONContent | null {
  if (node.type === 'text') {
    const text = node.text ?? '';

    if (text.length <= maxChars) {
      return node;
    }

    return { ...node, text: text.slice(0, maxChars) + '...' };
  }

  if (!node.content || node.content.length === 0) {
    return node;
  }

  let charCount = 0;
  const truncatedContent: JSONContent[] = [];

  for (const child of node.content) {
    const childText = tiptapJsonToPlainText(child);
    const childLength = childText.length;

    if (charCount + childLength <= maxChars) {
      truncatedContent.push(child);
      charCount += childLength;
    } else {
      const remaining = maxChars - charCount;

      if (remaining > 0) {
        const truncatedChild = truncateNode(child, remaining);

        if (truncatedChild) {
          truncatedContent.push(truncatedChild);
        }
      }

      break;
    }
  }

  return { ...node, content: truncatedContent };
}

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
