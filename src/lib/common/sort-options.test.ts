import { describe, expect, it } from 'vitest';

import { sortOptionsAlphabetically } from './sort-options';

describe('sortOptionsAlphabetically', () => {
  it('sorts options alphabetically by label', () => {
    const options = [
      { value: 'c', label: 'Cherry' },
      { value: 'a', label: 'Apple' },
      { value: 'b', label: 'Banana' },
    ];

    const result = sortOptionsAlphabetically(options);

    expect(result.map((o) => o.label)).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('pins "other" to the end', () => {
    const options = [
      { value: 'other', label: 'Other' },
      { value: 'a', label: 'Apple' },
      { value: 'b', label: 'Banana' },
    ];

    const result = sortOptionsAlphabetically(options);

    expect(result.map((o) => o.value)).toEqual(['a', 'b', 'other']);
  });

  it('keeps "other" at the end even when it would sort first alphabetically', () => {
    const options = [
      { value: 'z', label: 'Zucchini' },
      { value: 'other', label: 'AAA' },
      { value: 'a', label: 'Apple' },
    ];

    const result = sortOptionsAlphabetically(options);

    expect(result.map((o) => o.value)).toEqual(['a', 'z', 'other']);
  });

  it('does not mutate the original array', () => {
    const options = [
      { value: 'b', label: 'Banana' },
      { value: 'a', label: 'Apple' },
    ] as const;

    const result = sortOptionsAlphabetically(options);

    expect(result).not.toBe(options);
    expect(options[0]!.value).toBe('b');
  });

  it('returns an empty array for empty input', () => {
    expect(sortOptionsAlphabetically([])).toEqual([]);
  });

  it('handles a single option', () => {
    const options = [{ value: 'a', label: 'Apple' }];
    expect(sortOptionsAlphabetically(options)).toEqual([{ value: 'a', label: 'Apple' }]);
  });

  it('handles a single "other" option', () => {
    const options = [{ value: 'other', label: 'Other' }];
    expect(sortOptionsAlphabetically(options)).toEqual([{ value: 'other', label: 'Other' }]);
  });

  it('preserves extra properties on option objects', () => {
    const options = [
      { value: 'b', label: 'Banana', icon: 'banana-icon' },
      { value: 'a', label: 'Apple', icon: 'apple-icon' },
    ];

    const result = sortOptionsAlphabetically(options);

    expect(result[0]).toEqual({ value: 'a', label: 'Apple', icon: 'apple-icon' });
  });

  it('uses locale-aware comparison for labels with diacritics', () => {
    const options = [
      { value: 'z', label: 'Zelda' },
      { value: 'e', label: 'Ewa' },
      { value: 'a', label: 'Aga' },
    ];

    const result = sortOptionsAlphabetically(options);

    expect(result.map((o) => o.label)).toEqual(['Aga', 'Ewa', 'Zelda']);
  });
});
