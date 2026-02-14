'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';

const INITIAL_VISIBLE = 5;

interface TextAnswersListProps {
  answers: QuestionAnswerData[];
}

export const TextAnswersList = ({ answers }: TextAnswersListProps) => {
  const t = useTranslations('surveys.stats');
  const [expanded, setExpanded] = useState(false);

  const textAnswers = answers
    .map((a) => (a.value.text as string) ?? '')
    .filter((txt) => txt.trim().length > 0);

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
