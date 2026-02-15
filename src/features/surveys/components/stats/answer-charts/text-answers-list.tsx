'use client';

import { useMemo, useState } from 'react';

import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';
import { STOPWORDS } from '@/features/surveys/lib/stopwords';

const INITIAL_VISIBLE = 5;
const MAX_KEYWORDS = 8;
const MIN_WORD_LENGTH = 3;

interface TextAnswersListProps {
  answers: QuestionAnswerData[];
}

export const TextAnswersList = ({ answers }: TextAnswersListProps) => {
  const t = useTranslations();
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
    return <p className="text-muted-foreground text-xs">{t('surveys.stats.noTextResponses')}</p>;
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
          {t('surveys.stats.responsesCount', { count: textAnswers.length })}
        </span>
        <span className="text-border/60 text-xs" aria-hidden>
          ·
        </span>
        <span className="text-muted-foreground text-xs">
          {t('surveys.stats.averageLength', { chars: avgLength })}
        </span>
      </div>

      {keywords.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-[11px] font-medium">
            {t('surveys.stats.topKeywords')}
          </p>
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
                  {t('surveys.stats.charactersCount', { count: len })}
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
              {t('surveys.stats.showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5 shrink-0" aria-hidden />
              {t('surveys.stats.showMore')} ({textAnswers.length - INITIAL_VISIBLE})
            </>
          )}
        </Button>
      )}
    </div>
  );
};
