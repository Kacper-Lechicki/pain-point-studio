// @vitest-environment jsdom
/** Tests for the useKeywordExtraction hook that extracts top recurring words from text arrays. */
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useKeywordExtraction } from './use-keyword-extraction';

describe('useKeywordExtraction', () => {
  it('should return empty array for empty texts', () => {
    const { result } = renderHook(() => useKeywordExtraction([]));
    expect(result.current).toEqual([]);
  });

  it('should return empty when a word appears only once (count < 2)', () => {
    const { result } = renderHook(() => useKeywordExtraction(['unique word here']));
    expect(result.current).toEqual([]);
  });

  it('should return words appearing twice or more', () => {
    const texts = ['performance issue', 'performance problem'];
    const { result } = renderHook(() => useKeywordExtraction(texts));

    expect(result.current).toContainEqual({ word: 'performance', count: 2 });
  });

  it('should filter out stopwords', () => {
    const texts = ['the the the the', 'the the the'];
    const { result } = renderHook(() => useKeywordExtraction(texts));

    expect(result.current).toEqual([]);
  });

  it('should filter out words shorter than 3 chars', () => {
    const texts = ['go go go go', 'go go'];
    const { result } = renderHook(() => useKeywordExtraction(texts));

    expect(result.current).toEqual([]);
  });

  it('should sort results by count descending', () => {
    const texts = ['loading loading loading speed speed slow', 'loading loading speed slow slow'];
    const { result } = renderHook(() => useKeywordExtraction(texts));

    expect(result.current[0]?.word).toBe('loading');
    expect(result.current[0]?.count).toBe(5);
    expect(result.current[1]?.word).toBe('speed');
    expect(result.current[1]?.count).toBe(3);
    expect(result.current[2]?.word).toBe('slow');
    expect(result.current[2]?.count).toBe(3);
  });

  it('should return maximum 10 keywords', () => {
    const words = Array.from({ length: 15 }, (_, i) => `keyword${i}`);
    const texts = words.map((w) => `${w} ${w}`);
    const { result } = renderHook(() => useKeywordExtraction(texts));

    expect(result.current.length).toBeLessThanOrEqual(10);
  });

  it('should strip punctuation before counting', () => {
    const texts = ['testing! testing.', 'testing, testing?'];
    const { result } = renderHook(() => useKeywordExtraction(texts));

    expect(result.current).toContainEqual({ word: 'testing', count: 4 });
  });

  it('should be case insensitive', () => {
    const texts = ['Hello world', 'hello World'];
    const { result } = renderHook(() => useKeywordExtraction(texts));

    expect(result.current).toContainEqual({ word: 'hello', count: 2 });
    expect(result.current).toContainEqual({ word: 'world', count: 2 });
  });
});
