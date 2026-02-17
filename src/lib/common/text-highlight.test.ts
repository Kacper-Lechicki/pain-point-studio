/** Text highlight utility: search term matching and segmentation. */
import { describe, expect, it } from 'vitest';

import { buildHighlightRegex, highlightText } from './text-highlight';

describe('buildHighlightRegex', () => {
  it('should return null for empty array', () => {
    expect(buildHighlightRegex([])).toBeNull();
  });

  it('should create a word-boundary regex for a single word', () => {
    const regex = buildHighlightRegex(['hello']);

    expect(regex).toBeInstanceOf(RegExp);
    expect(regex!.source).toBe('\\b(hello)\\b');
  });

  it('should create alternation regex for multiple words', () => {
    const regex = buildHighlightRegex(['foo', 'bar']);

    expect(regex!.source).toBe('\\b(foo|bar)\\b');
  });

  it('should escape special regex characters', () => {
    const regex = buildHighlightRegex(['file.txt', 'price$']);

    expect(regex!.source).toBe('\\b(file\\.txt|price\\$)\\b');
  });

  it('should be case insensitive', () => {
    const regex = buildHighlightRegex(['test']);

    expect(regex!.flags).toContain('i');
  });
});

describe('highlightText', () => {
  it('should return single non-highlighted segment for null regex', () => {
    const result = highlightText('hello world', null);

    expect(result).toEqual([{ text: 'hello world', highlight: false }]);
  });

  it('should highlight a single match in the middle', () => {
    const regex = buildHighlightRegex(['world']);
    const result = highlightText('hello world today', regex);

    expect(result).toEqual([
      { text: 'hello ', highlight: false },
      { text: 'world', highlight: true },
      { text: ' today', highlight: false },
    ]);
  });

  it('should highlight multiple matches', () => {
    const regex = buildHighlightRegex(['the']);
    const result = highlightText('the cat and the dog', regex);

    expect(result).toEqual([
      { text: 'the', highlight: true },
      { text: ' cat and ', highlight: false },
      { text: 'the', highlight: true },
      { text: ' dog', highlight: false },
    ]);
  });

  it('should highlight match at start and end', () => {
    const regex = buildHighlightRegex(['hi', 'bye']);
    const result = highlightText('hi there bye', regex);

    expect(result).toEqual([
      { text: 'hi', highlight: true },
      { text: ' there ', highlight: false },
      { text: 'bye', highlight: true },
    ]);
  });

  it('should return single non-highlighted segment when nothing matches', () => {
    const regex = buildHighlightRegex(['xyz']);
    const result = highlightText('hello world', regex);

    expect(result).toEqual([{ text: 'hello world', highlight: false }]);
  });

  it('should handle adjacent matches', () => {
    const regex = buildHighlightRegex(['one', 'two']);
    const result = highlightText('one two', regex);

    expect(result).toEqual([
      { text: 'one', highlight: true },
      { text: ' ', highlight: false },
      { text: 'two', highlight: true },
    ]);
  });

  it('should match case insensitively', () => {
    const regex = buildHighlightRegex(['hello']);
    const result = highlightText('say HELLO now', regex);

    expect(result).toEqual([
      { text: 'say ', highlight: false },
      { text: 'HELLO', highlight: true },
      { text: ' now', highlight: false },
    ]);
  });
});
