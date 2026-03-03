import type { JSONContent } from '@tiptap/react';
import { describe, expect, it } from 'vitest';

import { NOTE_TITLE_MAX_LENGTH } from '@/features/projects/config';

import { extractTitleFromTiptap } from './note-helpers';

describe('extractTitleFromTiptap', () => {
  it('returns Untitled for null input', () => {
    expect(extractTitleFromTiptap(null)).toBe('Untitled');
  });

  it('returns Untitled for undefined input', () => {
    expect(extractTitleFromTiptap(undefined)).toBe('Untitled');
  });

  it('returns Untitled for empty content array', () => {
    expect(extractTitleFromTiptap({ type: 'doc', content: [] })).toBe('Untitled');
  });

  it('returns Untitled for missing content property', () => {
    expect(extractTitleFromTiptap({ type: 'doc' })).toBe('Untitled');
  });

  it('returns Untitled when first block has no text', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };

    expect(extractTitleFromTiptap(json)).toBe('Untitled');
  });

  it('extracts text from a simple paragraph', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello World' }],
        },
      ],
    };

    expect(extractTitleFromTiptap(json)).toBe('Hello World');
  });

  it('extracts text from a heading node', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'My Heading' }],
        },
      ],
    };

    expect(extractTitleFromTiptap(json)).toBe('My Heading');
  });

  it('concatenates text from multiple inline children', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', text: 'World' },
          ],
        },
      ],
    };

    expect(extractTitleFromTiptap(json)).toBe('Hello World');
  });

  it('handles nested nodes (e.g., bold + text)', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Normal ' },
            {
              type: 'bold',
              content: [{ type: 'text', text: 'Bold' }],
            },
            { type: 'text', text: ' text' },
          ],
        },
      ],
    };

    expect(extractTitleFromTiptap(json)).toBe('Normal Bold text');
  });

  it('trims whitespace from extracted text', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '  spaced title  ' }],
        },
      ],
    };

    expect(extractTitleFromTiptap(json)).toBe('spaced title');
  });

  it('truncates text exceeding NOTE_TITLE_MAX_LENGTH', () => {
    const longText = 'a'.repeat(NOTE_TITLE_MAX_LENGTH + 50);
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: longText }],
        },
      ],
    };

    const result = extractTitleFromTiptap(json);

    expect(result).toHaveLength(NOTE_TITLE_MAX_LENGTH);
    expect(result).toBe('a'.repeat(NOTE_TITLE_MAX_LENGTH));
  });

  it('does not truncate text at exactly NOTE_TITLE_MAX_LENGTH', () => {
    const exactText = 'b'.repeat(NOTE_TITLE_MAX_LENGTH);
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: exactText }],
        },
      ],
    };

    expect(extractTitleFromTiptap(json)).toBe(exactText);
  });

  it('only extracts from the first block, ignoring subsequent blocks', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'First block' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Second block' }],
        },
      ],
    };

    expect(extractTitleFromTiptap(json)).toBe('First block');
  });

  it('returns Untitled for whitespace-only first block', () => {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '   ' }],
        },
      ],
    };

    expect(extractTitleFromTiptap(json)).toBe('Untitled');
  });
});
