import { describe, expect, it } from 'vitest';

import { buildHighlightRegex, highlightText } from './text-highlight';

// ── buildHighlightRegex ─────────────────────────────────────────────

describe('buildHighlightRegex', () => {
  it('returns null for empty array', () => {
    expect(buildHighlightRegex([])).toBeNull();
  });

  it('creates a word-boundary regex for a single word', () => {
    const regex = buildHighlightRegex(['hello']);

    expect(regex).toBeInstanceOf(RegExp);
    expect(regex!.source).toBe('\\b(hello)\\b');
  });

  it('creates alternation regex for multiple words', () => {
    const regex = buildHighlightRegex(['foo', 'bar']);

    expect(regex!.source).toBe('\\b(foo|bar)\\b');
  });

  it('escapes special regex characters', () => {
    const regex = buildHighlightRegex(['file.txt', 'price$']);

    expect(regex!.source).toBe('\\b(file\\.txt|price\\$)\\b');
  });

  it('is case insensitive', () => {
    const regex = buildHighlightRegex(['test']);

    expect(regex!.flags).toContain('i');
  });
});

// ── highlightText ───────────────────────────────────────────────────

describe('highlightText', () => {
  it('returns single non-highlighted segment for null regex', () => {
    const result = highlightText('hello world', null);

    expect(result).toEqual([{ text: 'hello world', highlight: false }]);
  });

  it('highlights a single match in the middle', () => {
    const regex = buildHighlightRegex(['world']);
    const result = highlightText('hello world today', regex);

    expect(result).toEqual([
      { text: 'hello ', highlight: false },
      { text: 'world', highlight: true },
      { text: ' today', highlight: false },
    ]);
  });

  it('highlights multiple matches', () => {
    const regex = buildHighlightRegex(['the']);
    const result = highlightText('the cat and the dog', regex);

    expect(result).toEqual([
      { text: 'the', highlight: true },
      { text: ' cat and ', highlight: false },
      { text: 'the', highlight: true },
      { text: ' dog', highlight: false },
    ]);
  });

  it('highlights match at start and end', () => {
    const regex = buildHighlightRegex(['hi', 'bye']);
    const result = highlightText('hi there bye', regex);

    expect(result).toEqual([
      { text: 'hi', highlight: true },
      { text: ' there ', highlight: false },
      { text: 'bye', highlight: true },
    ]);
  });

  it('returns single non-highlighted segment when nothing matches', () => {
    const regex = buildHighlightRegex(['xyz']);
    const result = highlightText('hello world', regex);

    expect(result).toEqual([{ text: 'hello world', highlight: false }]);
  });

  it('handles adjacent matches', () => {
    const regex = buildHighlightRegex(['one', 'two']);
    const result = highlightText('one two', regex);

    expect(result).toEqual([
      { text: 'one', highlight: true },
      { text: ' ', highlight: false },
      { text: 'two', highlight: true },
    ]);
  });

  it('matches case insensitively', () => {
    const regex = buildHighlightRegex(['hello']);
    const result = highlightText('say HELLO now', regex);

    expect(result).toEqual([
      { text: 'say ', highlight: false },
      { text: 'HELLO', highlight: true },
      { text: ' now', highlight: false },
    ]);
  });
});
