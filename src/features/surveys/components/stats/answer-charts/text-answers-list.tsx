'use client';

import { useMemo, useState } from 'react';

import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';

const INITIAL_VISIBLE = 5;
const MAX_KEYWORDS = 8;
const MIN_WORD_LENGTH = 3;

// Common English stopwords to filter out of keyword extraction
const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'is',
  'it',
  'its',
  'was',
  'are',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'not',
  'no',
  'nor',
  'so',
  'as',
  'if',
  'then',
  'than',
  'too',
  'very',
  'just',
  'that',
  'this',
  'these',
  'those',
  'they',
  'them',
  'their',
  'there',
  'here',
  'where',
  'when',
  'how',
  'what',
  'which',
  'who',
  'whom',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'only',
  'own',
  'same',
  'also',
  'about',
  'into',
  'over',
  'after',
  'before',
  'between',
  'under',
  'again',
  'because',
  'while',
  'during',
  'through',
  'above',
  'below',
  'out',
  'off',
  'up',
  'down',
  'any',
  'don',
  'doesn',
  'didn',
  'won',
  'isn',
  'aren',
  'wasn',
  'weren',
  'hasn',
  'haven',
  'hadn',
  'wouldn',
  'couldn',
  'shouldn',
  'really',
  'much',
  'many',
  'like',
  'well',
  'get',
  'got',
  'make',
  'made',
  'still',
  'even',
  'back',
  'way',
  'our',
  'you',
  'your',
  'his',
  'her',
  'she',
  'him',
  'my',
  'me',
  'we',
  'us',
]);

interface TextAnswersListProps {
  answers: QuestionAnswerData[];
}

export const TextAnswersList = ({ answers }: TextAnswersListProps) => {
  const t = useTranslations('surveys.stats');
  const [expanded, setExpanded] = useState(false);

  const textAnswers = answers
    .map((a) => (a.value.text as string) ?? '')
    .filter((txt) => txt.trim().length > 0);

  const keywords = useMemo(() => {
    if (textAnswers.length === 0) {
      return [];
    }

    const counts = new Map<string, number>();

    for (const text of textAnswers) {
      const words = text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/);

      for (const word of words) {
        if (word.length >= MIN_WORD_LENGTH && !STOPWORDS.has(word)) {
          counts.set(word, (counts.get(word) ?? 0) + 1);
        }
      }
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_KEYWORDS)
      .map(([word, count]) => ({ word, count }));
  }, [textAnswers]);

  if (textAnswers.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('noTextResponses')}</p>;
  }

  const totalChars = textAnswers.reduce((sum, txt) => sum + txt.length, 0);
  const avgLength = Math.round(totalChars / textAnswers.length);
  const visibleCount = expanded
    ? textAnswers.length
    : Math.min(INITIAL_VISIBLE, textAnswers.length);
  const hasMore = textAnswers.length > INITIAL_VISIBLE;

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2">
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <MessageSquare className="size-3.5" aria-hidden />
          {t('responsesCount', { count: textAnswers.length })}
        </span>
        <span className="text-border/60 text-xs" aria-hidden>
          ·
        </span>
        <span className="text-muted-foreground text-xs">
          {t('averageLength', { chars: avgLength })}
        </span>
      </div>

      {keywords.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-[11px] font-medium">{t('topKeywords')}</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map(({ word, count }) => (
              <Badge key={word} variant="outline" className="text-[11px] font-normal">
                {word} ({count})
              </Badge>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-3" role="list">
        {textAnswers.slice(0, visibleCount).map((text: string, i: number) => {
          const len = text.length;

          return (
            <li key={i}>
              <blockquote
                className="bg-background/50 relative rounded-r-md border-l-4 py-2.5 pr-3 pl-3 text-sm leading-relaxed sm:pr-4 sm:pl-4"
                style={{ borderLeftColor: 'var(--chart-text-accent)' }}
              >
                <p className="text-foreground/90 break-words whitespace-pre-wrap">{text}</p>
                <span
                  className="text-muted-foreground mt-1.5 block text-[11px] tabular-nums"
                  aria-hidden
                >
                  {t('charactersCount', { count: len })}
                </span>
              </blockquote>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -mb-1 w-full gap-1.5 text-xs"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3.5 shrink-0" aria-hidden />
              {t('showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5 shrink-0" aria-hidden />
              {t('showMore')} ({textAnswers.length - INITIAL_VISIBLE})
            </>
          )}
        </Button>
      )}
    </div>
  );
};
