import { useMemo } from 'react';

import { TEXT_SEARCH_MAX_KEYWORDS, TEXT_SEARCH_MIN_WORD_LENGTH } from '@/features/surveys/config';
import { STOPWORDS } from '@/features/surveys/lib/stopwords';

interface KeywordEntry {
  word: string;
  count: number;
}

export function useKeywordExtraction(texts: string[]): KeywordEntry[] {
  return useMemo(() => {
    if (texts.length === 0) {
      return [];
    }

    const counts = new Map<string, number>();

    for (const text of texts) {
      const words = text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/);

      for (const word of words) {
        if (word.length >= TEXT_SEARCH_MIN_WORD_LENGTH && !STOPWORDS.has(word)) {
          counts.set(word, (counts.get(word) ?? 0) + 1);
        }
      }
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TEXT_SEARCH_MAX_KEYWORDS)
      .map(([word, count]) => ({ word, count }));
  }, [texts]);
}
